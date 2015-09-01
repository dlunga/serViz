from django.contrib import admin
from customerReviews.models import Consumerreports
from customerReviews.models import Servicereportsgeocodedextended 
class ConsumerAdmin(admin.ModelAdmin):
    list_display = ('consumer_name', 'supplier_name', 'industry_name','branch_area','consumer_comment','comment_datetime')
    search_fields = ('supplier_name', 'branch_area','comment_datetime')
    list_filter = ('comment_datetime',)
    date_hierarchy = 'comment_datetime'
    ordering = ('-comment_datetime',)
    
    
admin.site.register(Consumerreports,ConsumerAdmin)