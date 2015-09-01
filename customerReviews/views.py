from __future__ import division
from django.shortcuts import render
from django.http import HttpResponse
from customerReviews.models import Consumerreports
from customerReviews.models import Servicereportsgeocodedextended as unscored_comments
from customerReviews.models import Servicereportsscoredextended as scored_comments 
import pandas as pd
from operator import itemgetter
import numpy as np
import math, itertools
import json
from django.db.models import Q

import csv
import collections
# def search_form(request):
#     return render(request, 'search_form.html')
  
def search(request):
    errors = []
    if 'q' in request.GET:
        q = request.GET['q']
        if not q:
            errors.append('Enter a search term.')
        elif len(q) > 20:
            errors.append('Please enter at most 20 characters.')
        else:
            #suppliers = Consumerreports.objects.filter(supplier_name__icontains=q)
            suppliers = Consumerreports.objects.filter(supplier_name=q)
            return render(request, 'search_results.html',{'suppliers': suppliers, 'query': q})
    return render(request, 'search_form.html',{'errors': errors})

# def myexample(request):
#     reader = csv.reader(open('customerReviews/flights-3m.json'), delimiter=',', quotechar='"')
#     flightdicts = []
#     for row in reader:
#         flightdicts.append({"date":row[0], "delay":row[1],"distance":row[2],"origin":row[3],"destination":row[4]}) 
#     suppliers = Consumerreports.objects.values_list('supplier_name')
#     supplier_series = pd.Series(suppliers)
#     supplier = dict(supplier_series.value_counts())
#     temp_keys = supplier.keys()
#     max_val = np.max(supplier.values())
#     temp_log_vals = [math.floor(float(val/np.abs(max_val)*20)) for val in supplier.values()]
#     supplier_dict = dict(itertools.izip(temp_keys, temp_log_vals))
#     #create a sorted list from supplier dictionary values - dictionary are never sorted hence lists
#     supplierlist = sorted(supplier_dict.items(), key=itemgetter(1), reverse=True)
#     supplier_list =[]
#     #create a list of dictinaries
#     for key,val in supplierlist[:7]:
#         supplier_list.append({'count': val,'supplier_name': key}) 
#     getdata = GeoData()
#     return render(request, 'my_examplev1.html',{'latest_marks': json.dumps(getdata.latlondata()), "supplier_list": json.dumps(supplier_list), "flightdicts": flightdicts[1:]})

def customer_service(request):
    service_set = unscored_comments.objects.filter(~Q(latitude = 0)) #this is access to unscored comments
    #service_set = scored_comments.objects.filter(~Q(latitude = 0))
    results = [ob.as_json() for ob in  service_set[:2000]] #service_set[:20000]]
    return render(request, 'hellopeter-viz-v2.html',{"service_reports":json.dumps(results)}) 
    #return render(request, 'hellopeter-viz.html',{"service_reports":json.dumps(results)})

# This code has been obtained from the following website and posted by RichieHindle: 
# http://stackoverflow.com/questions/1254454/fastest-way-to-convert-a-dicts-keys-values-from-unicode-to-str
def convert(data):
    if isinstance(data, basestring):
        return str(data)
    elif isinstance(data, collections.Mapping):
        return dict(map(convert, data.iteritems()))
    elif isinstance(data, collections.Iterable):
        return type(data)(map(convert, data))
    else:
        return data

# Prints:
   
def customer_serviz(request):
    #service_set = unscored_comments.objects.filter(~Q(latitude = 0)) #this is access to unscored comments
    service_set = scored_comments.objects.filter(~Q(latitude = 0))
    results = [ob.as_json() for ob in  service_set[:5000]] #service_set[:20000]]
    
    json_data=open('customerReviews/static/local/treedat.json').read()
    js_data = json.loads(json_data)
    #convert json data from unicode back to strings
    js_data1 = convert(js_data)

#     js_data1 = js_data.decode(encoding='UTF-8',errors='strict')
    #print(js_data1)
    
    province1 = ""
    province2 = ""
    province3 = ""
    province4 = ""
    
    province1int = province2int = province3int = province4int = 0
        
    if( "Province1" in request.POST ): 
        province1 = request.POST["Province1"].lower()
    if( "Province2" in request.POST ):
        province2 = request.POST["Province2"].lower()
    if( "Province3" in request.POST ): 
        province3 = request.POST["Province3"].lower()
    if( "Province4" in request.POST ):
        province4 = request.POST["Province4"].lower()
        
    if province1 == "gauteng":
        province1int = 1
    elif province1 == "westerncape":
        province1int = 2
    elif province1 == "easterncape":
        province1int = 3
    elif province1 == "northerncape":
        province1int = 4
    elif province1 == "freestate":
        province1int = 5
    elif province1 == "kzn":
        province1int = 6
    elif province1 == "limpopo":
        province1int = 7
    elif province1 == "mpumalanga":
        province1int = 8
    elif province1 == "northwest":
        province1int = 9 
        
        
    if province2 == "gauteng":
        province2int = 1
    elif province2 == "westerncape":
        province2int = 2
    elif province2 == "easterncape":
        province2int = 3
    elif province2 == "northerncape":
        province2int = 4
    elif province2 == "freestate":
        province2int = 5
    elif province2 == "kzn":
        province2int = 6
    elif province2 == "limpopo":
        province2int = 7
    elif province2 == "mpumalanga":
        province2int = 8
    elif province2 == "northwest":
        province2int = 9 
        
    
    if province3 == "gauteng":
        province3int = 1
    elif province3 == "westerncape":
        province3int = 2
    elif province3 == "easterncape":
        province3int = 3
    elif province3 == "northerncape":
        province3int = 4
    elif province3 == "freestate":
        province3int = 5
    elif province3 == "kzn":
        province3int = 6
    elif province3 == "limpopo":
        province3int = 7
    elif province3 == "mpumalanga":
        province3int = 8
    elif province3 == "northwest":
        province3int = 9
        
        
    if province4 == "gauteng":
        province4int = 1
    elif province4 == "westerncape":
        province4int = 2
    elif province4 == "easterncape":
        province4int = 3
    elif province4 == "northerncape":
        province4int = 4
    elif province4 == "freestate":
        province4int = 5
    elif province4 == "kzn":
        province4int = 6
    elif province4 == "limpopo":
        province4int = 7
    elif province4 == "mpumalanga":
        province4int = 8
    elif province4 == "northwest":
        province4int = 9  
                  
    return render(request, 'myFullPageDemov2.html',{"service_reports":json.dumps(results), "province1int":province1int, "province2int": province2int, "province3int":province3int, "province4int":province4int, "js_data1":js_data1})

def dst_sankey(request):
    return render(request, 'dst-sankey.html') 
    #return render(request, 'hellopeter-viz.html',{"service_reports":json.dumps(results)})
    
def customer_service_updated(request):
    #service_set = unscored_comments.objects.filter(~Q(latitude = 0)) #this is access to unscored comments
    service_set = scored_comments.objects.filter(~Q(latitude = 0))
    results = [ob.as_json() for ob in  service_set[:5000]] #service_set[:20000]]
    
    json_data=open('customerReviews/static/local/treedat.json').read()
    js_data = json.loads(json_data)
    #convert json data from unicode back to strings
    js_data1 = convert(js_data)

#     js_data1 = js_data.decode(encoding='UTF-8',errors='strict')
    #print(js_data1)
    
    province1 = ""
    province2 = ""
    province3 = ""
    province4 = ""
    
    province1int = province2int = province3int = province4int = 0
        
    if( "Province1" in request.POST ): 
        province1 = request.POST["Province1"].lower()
    if( "Province2" in request.POST ):
        province2 = request.POST["Province2"].lower()
    if( "Province3" in request.POST ): 
        province3 = request.POST["Province3"].lower()
    if( "Province4" in request.POST ):
        province4 = request.POST["Province4"].lower()
        
    if province1 == "gauteng":
        province1int = 1
    elif province1 == "westerncape":
        province1int = 2
    elif province1 == "easterncape":
        province1int = 3
    elif province1 == "northerncape":
        province1int = 4
    elif province1 == "freestate":
        province1int = 5
    elif province1 == "kzn":
        province1int = 6
    elif province1 == "limpopo":
        province1int = 7
    elif province1 == "mpumalanga":
        province1int = 8
    elif province1 == "northwest":
        province1int = 9 
        
        
    if province2 == "gauteng":
        province2int = 1
    elif province2 == "westerncape":
        province2int = 2
    elif province2 == "easterncape":
        province2int = 3
    elif province2 == "northerncape":
        province2int = 4
    elif province2 == "freestate":
        province2int = 5
    elif province2 == "kzn":
        province2int = 6
    elif province2 == "limpopo":
        province2int = 7
    elif province2 == "mpumalanga":
        province2int = 8
    elif province2 == "northwest":
        province2int = 9 
        
    
    if province3 == "gauteng":
        province3int = 1
    elif province3 == "westerncape":
        province3int = 2
    elif province3 == "easterncape":
        province3int = 3
    elif province3 == "northerncape":
        province3int = 4
    elif province3 == "freestate":
        province3int = 5
    elif province3 == "kzn":
        province3int = 6
    elif province3 == "limpopo":
        province3int = 7
    elif province3 == "mpumalanga":
        province3int = 8
    elif province3 == "northwest":
        province3int = 9
        
        
    if province4 == "gauteng":
        province4int = 1
    elif province4 == "westerncape":
        province4int = 2
    elif province4 == "easterncape":
        province4int = 3
    elif province4 == "northerncape":
        province4int = 4
    elif province4 == "freestate":
        province4int = 5
    elif province4 == "kzn":
        province4int = 6
    elif province4 == "limpopo":
        province4int = 7
    elif province4 == "mpumalanga":
        province4int = 8
    elif province4 == "northwest":
        province4int = 9  
                  
    return render(request, 'myFullPageDemoSeptember2015.html',{"service_reports":json.dumps(results), "province1int":province1int, "province2int": province2int, "province3int":province3int, "province4int":province4int, "js_data1":js_data1})

