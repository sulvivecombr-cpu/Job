from django.urls import path
from .views import EstadosView, MunicipiosView, CepView, ValidarDocumentoView

urlpatterns = [
    path("estados/", EstadosView.as_view(), name="brasil-estados"),
    path("estados/<str:uf>/municipios/", MunicipiosView.as_view(), name="brasil-municipios"),
    path("cep/<str:cep>/", CepView.as_view(), name="brasil-cep"),
    path("validar-documento/", ValidarDocumentoView.as_view(), name="brasil-validar-documento"),
]
