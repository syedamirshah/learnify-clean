from django import template

register = template.Library()

@register.filter
def replace(value, arg):
    try:
        old, new = arg.split(',', 1)
        return value.replace(old.strip(), new.strip())
    except ValueError:
        return value