from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('expert', 'Expert'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    def save(self, *args, **kwargs):
        if self.pk:
            orig = User.objects.get(pk=self.pk)
            if orig.role != self.role:
                raise ValueError("Role cannot be changed once set.")
        super().save(*args, **kwargs)
