from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

# Create your models here.

class User(AbstractUser):
    class RoleChoiceField(models.TextChoices):
        PROVIDER='provider'
        CUSTOMER='customer'

    role=models.CharField(max_length=10,choices=RoleChoiceField.choices,default=RoleChoiceField.CUSTOMER)
    phone=models.CharField(max_length=13)
    latitude=models.DecimalField(max_digits=9,decimal_places=6,null=True,blank=True)
    longitude=models.DecimalField(max_digits=9,decimal_places=6,null=True,blank=True)
    radius=models.PositiveIntegerField(validators=[MinValueValidator(1),MaxValueValidator(50)],null=True,blank=True)
    profile_photo=models.ImageField(upload_to='uploads/',null=True,blank=True)

    # Dados brasileiros
    cpf=models.CharField(max_length=14,unique=True,null=True,blank=True)
    cep=models.CharField(max_length=9,blank=True,default='')
    logradouro=models.CharField(max_length=120,blank=True,default='')
    numero=models.CharField(max_length=10,blank=True,default='')
    complemento=models.CharField(max_length=60,blank=True,default='')
    bairro=models.CharField(max_length=60,blank=True,default='')
    cidade=models.CharField(max_length=60,blank=True,default='')
    estado=models.CharField(max_length=2,blank=True,default='')
