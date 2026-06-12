from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_teachertask_school'),
    ]

    operations = [
        migrations.AddField(
            model_name='school',
            name='logo',
            field=models.ImageField(blank=True, null=True, upload_to='school_logos/'),
        ),
    ]
