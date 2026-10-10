from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .services import listar_estados, listar_municipios, buscar_cep, validar_documento


class EstadosView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(listar_estados())


class MunicipiosView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uf):
        try:
            return Response(listar_municipios(uf))
        except Exception:
            return Response({"erro": "UF inválida"}, status=status.HTTP_400_BAD_REQUEST)


class CepView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, cep):
        try:
            return Response(buscar_cep(cep))
        except ValueError as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"erro": "Erro ao consultar CEP"}, status=status.HTTP_502_BAD_GATEWAY)


class ValidarDocumentoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        documento = request.data.get("documento", "")
        tipo = request.data.get("tipo")
        if not documento:
            return Response({"erro": "Documento não informado"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(validar_documento(documento, tipo))
