"""
Integrações com APIs brasileiras: IBGE, Correios (ViaCEP) e SERPRO.

- IBGE: listagem de estados (UFs) e municípios.
- Correios (ViaCEP): consulta de endereço por CEP (dados postais dos Correios).
- SERPRO: validação de CPF/CNPJ (com validação local como fallback).
"""
import os
import re

import requests
from django.core.cache import cache

IBGE_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades"
VIACEP_BASE = "https://viacep.com.br/ws"
SERPRO_BASE = "https://apiclinest.serpro.gov.br"


def _so_numeros(value):
    return re.sub(r"\D", "", value or "")


# ── IBGE ──────────────────────────────────────────────

def listar_estados():
    """Retorna lista de estados: [{"sigla": "SP", "nome": "São Paulo"}, ...]."""
    cache_key = "brasil:estados"
    estados = cache.get(cache_key)
    if estados is None:
        resp = requests.get(f"{IBGE_BASE}/estados", params={"orderBy": "nome"}, timeout=10)
        resp.raise_for_status()
        estados = [{"sigla": e["sigla"], "nome": e["nome"]} for e in resp.json()]
        cache.set(cache_key, estados, 86400)
    return estados


def listar_municipios(uf):
    """Retorna lista de municípios do estado (UF): [{"nome": "São Paulo"}, ...]."""
    uf = uf.upper()
    cache_key = f"brasil:municipios:{uf}"
    municipios = cache.get(cache_key)
    if municipios is None:
        resp = requests.get(
            f"{IBGE_BASE}/estados/{uf}/municipios",
            params={"orderBy": "nome"},
            timeout=10,
        )
        resp.raise_for_status()
        municipios = [{"nome": m["nome"]} for m in resp.json()]
        cache.set(cache_key, municipios, 86400)
    return municipios


# ── Correios (ViaCEP) ──────────────────────────────────

def buscar_cep(cep):
    """Consulta CEP via ViaCEP (dados postais dos Correios)."""
    cep = _so_numeros(cep)
    if len(cep) != 8:
        raise ValueError("CEP inválido")
    cache_key = f"brasil:cep:{cep}"
    resultado = cache.get(cache_key)
    if resultado is None:
        resp = requests.get(f"{VIACEP_BASE}/{cep}/json/", timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data.get("erro"):
            raise ValueError("CEP não encontrado")
        resultado = {
            "cep": data.get("cep", "").replace("-", ""),
            "logradouro": data.get("logradouro", ""),
            "complemento": data.get("complemento", ""),
            "bairro": data.get("bairro", ""),
            "cidade": data.get("localidade", ""),
            "estado": data.get("uf", ""),
        }
        cache.set(cache_key, resultado, 86400)
    return resultado


# ── SERPRO / Validação de CPF e CNPJ ───────────────────

def _validar_cpf(cpf):
    cpf = _so_numeros(cpf)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    for i in range(9, 11):
        soma = sum(int(cpf[j]) * (i + 1 - j) for j in range(i))
        digito = (soma * 10) % 11
        if digito == 10:
            digito = 0
        if digito != int(cpf[i]):
            return False
    return True


def _validar_cnpj(cnpj):
    cnpj = _so_numeros(cnpj)
    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        return False
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * pesos1[i] for i in range(12))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    if int(cnpj[12]) != digito1:
        return False
    pesos2 = [6] + pesos1
    soma = sum(int(cnpj[i]) * pesos2[i] for i in range(13))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    if int(cnpj[13]) != digito2:
        return False
    return True


def _verificar_serpro(documento, tipo):
    """Consulta SERPRO para verificar CPF/CNPJ. Requer credenciais configuradas."""
    client_id = os.getenv("SERPRO_CLIENT_ID")
    client_secret = os.getenv("SERPRO_CLIENT_SECRET")
    contrato = os.getenv("SERPRO_CONTRATO", "")

    auth = requests.post(
        f"{SERPRO_BASE}/token",
        data={"grant_type": "client_credentials"},
        auth=(client_id, client_secret),
        timeout=10,
    )
    auth.raise_for_status()
    token = auth.json()["access_token"]

    resp = requests.get(
        f"{SERPRO_BASE}/{tipo}/{documento}",
        headers={"Authorization": f"Bearer {token}", "x-contrato": contrato},
        timeout=10,
    )
    if resp.status_code == 200:
        return resp.json().get("ni") is not None or resp.json().get("cnpj") is not None
    return False


def validar_documento(documento, tipo=None):
    """Valida CPF ou CNPJ (algoritmo local) e, se configurado, consulta SERPRO."""
    doc = _so_numeros(documento)
    if tipo is None:
        tipo = "cnpj" if len(doc) == 14 else "cpf"

    if tipo == "cpf":
        valido = _validar_cpf(doc)
    elif tipo == "cnpj":
        valido = _validar_cnpj(doc)
    else:
        return {"valido": False, "tipo": tipo, "erro": "tipo inválido"}

    serpro_disponivel = bool(
        os.getenv("SERPRO_CLIENT_ID") and os.getenv("SERPRO_CLIENT_SECRET")
    )
    serpro_verificado = False
    if serpro_disponivel and valido:
        try:
            serpro_verificado = _verificar_serpro(doc, tipo)
        except Exception:
            serpro_verificado = False

    return {
        "valido": valido,
        "tipo": tipo,
        "serpro_disponivel": serpro_disponivel,
        "serpro_verificado": serpro_verificado,
    }
