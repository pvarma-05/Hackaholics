from django.db import models

# Create your models here.
class User(models.Model):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('expert', 'Expert'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    google_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
