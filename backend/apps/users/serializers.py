from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        return token


class CreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'username', 'email', 'role', 'password',
            'cpf', 'cep', 'logradouro', 'numero', 'complemento',
            'bairro', 'cidade', 'estado',
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "cpf": {"required": True},
            'cep': {"required": False},
            'logradouro': {"required": False},
            'numero': {"required": False},
            'complemento': {"required": False},
            'bairro': {"required": False},
            'cidade': {"required": False},
            'estado': {"required": False},
        }

    def validate_cpf(self, value):
        from apps.brasil.services import validar_documento
        resultado = validar_documento(value, 'cpf')
        if not resultado['valido']:
            raise serializers.ValidationError("CPF inválido")
        if User.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("CPF já cadastrado")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role',
            'cpf', 'cep', 'logradouro', 'numero', 'complemento',
            'bairro', 'cidade', 'estado',
        ]
        read_only_fields = ['id', 'username', 'role']

    def validate_cpf(self, value):
        if not value:
            return value
        from apps.brasil.services import validar_documento
        resultado = validar_documento(value, 'cpf')
        if not resultado['valido']:
            raise serializers.ValidationError("CPF inválido")
        if User.objects.filter(cpf=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("CPF já cadastrado")
        return value


class UpdateUserLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['latitude', 'longitude', 'radius']

    def update(self, instance, validated_data):
        instance.latitude = validated_data.get('latitude', instance.latitude)
        instance.longitude = validated_data.get('longitude', instance.longitude)
        instance.radius = validated_data.get('radius', instance.radius)

        instance.save()
        return instance


class ProfilePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['profile_photo']

    def validate_profile_photo(self, value):
        limit = 3 * 1024 * 1024
        if value.size > limit:
            raise serializers.ValidationError("photo is larger than 3MB.reduce the size of image")

        valid_extensions = ['.jpg', '.jpeg', '.png']
        import os
        ext = os.path.splitext(value.name)[1]
        if not ext.lower() in valid_extensions:
            raise serializers.ValidationError("only JPG and PNG  images are allowed")

        return value
