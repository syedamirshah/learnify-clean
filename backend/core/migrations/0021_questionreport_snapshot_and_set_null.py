from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0020_questionreport"),
    ]

    operations = [
        migrations.AddField(
            model_name="questionreport",
            name="question_snapshot",
            field=models.TextField(
                blank=True,
                help_text="Question text as seen at report time (preserved if source is edited/deleted).",
            ),
        ),
        migrations.AlterField(
            model_name="questionreport",
            name="quiz",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="question_reports",
                to="core.quiz",
            ),
        ),
        migrations.AlterField(
            model_name="questionreport",
            name="reported_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="question_reports",
                to="core.user",
            ),
        ),
    ]
