from django.conf.urls import patterns, include, url

from django.contrib import admin
admin.autodiscover()

from customerReviews import views

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^search/$', views.search),
    url(r'^servicecomplaints/$', views.customer_service),
    url(r'^customer-serviz/$', views.customer_serviz),
     url(r'^customer-serviz-september/$', views.customer_service_updated),
    url(r'^dst-sankey/$', views.dst_sankey),
    #url(r'^example/$', views.myexample),
    # Examples:
    # url(r'^$', 'DjangoTest1.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    
)
