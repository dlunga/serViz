'''
Created on Aug 7, 2014

@author: Dalton
'''
#from django.template.loader import get_template
#from django.template import Context
from django.http import HttpResponse
from django.shortcuts import render
import datetime

def hello(request):
    return HttpResponse("Hello World")

def home(request):
    return HttpResponse("Welcome Home Son")

def display_meta(request):
    values = request.META.items()
    values.sort()
    return render(request, 'meta.html', {'meta_list': values})


def current_datetime(request):
    now = datetime.datetime.now()
    return render(request, 'current_datetime.html', {'current_date': now})

def hours_ahead(request, offset):
    try:
        offset = int(offset)
    except ValueError:
        raise Http404()
    next_time = datetime.datetime.now() + datetime.timedelta(hours=offset)
    return render(request, 'hours_ahead.html', {'hour_offset': offset, 'next_time':next_time})
  