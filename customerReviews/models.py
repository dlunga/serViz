# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Remove `managed = False` lines if you wish to allow Django to create and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
#
# Also note: You'll have to insert the output of 'django-admin.py sqlcustom [appname]'
# into your database.
from __future__ import unicode_literals

from django.db import models
from bs4 import BeautifulSoup
from nltk.corpus import stopwords
from collections import Counter
import re
import nltk
#from sets import Set

class Consumerreports(models.Model):
    comment_id = models.BigIntegerField(primary_key=True)
    consumer_name = models.TextField(blank=True)
    supplier_name = models.TextField(blank=True)
    industry_name = models.TextField(blank=True)
    branch_area = models.TextField(blank=True)
    incident = models.TextField(blank=True)
    consumer_comment = models.TextField(blank=True)
    comment_nature = models.TextField(blank=True)
    comment_datetime = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'Consumerreports'

class AuthGroup(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=80)
    class Meta:
        managed = False
        db_table = 'auth_group'

class AuthGroupPermissions(models.Model):
    id = models.IntegerField(primary_key=True)
    group = models.ForeignKey(AuthGroup)
    permission = models.ForeignKey('AuthPermission')
    class Meta:
        managed = False
        db_table = 'auth_group_permissions'

class AuthPermission(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)
#     name = models.CharField(max_length=50)
    content_type = models.ForeignKey('DjangoContentType')
    codename = models.CharField(max_length=100)
    class Meta:
        managed = False
        db_table = 'auth_permission'

class AuthUser(models.Model):
    id = models.IntegerField(primary_key=True)
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField()
    is_superuser = models.BooleanField()
    username = models.CharField(max_length=30)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.CharField(max_length=75)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()
    class Meta:
        managed = False
        db_table = 'auth_user'

class AuthUserGroups(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.ForeignKey(AuthUser)
    group = models.ForeignKey(AuthGroup)
    class Meta:
        managed = False
        db_table = 'auth_user_groups'

class AuthUserUserPermissions(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.ForeignKey(AuthUser)
    permission = models.ForeignKey(AuthPermission)
    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'

class CustomerreviewsConsumerreports(models.Model):
    id = models.IntegerField(primary_key=True)
    comment_id = models.BigIntegerField()
    consumer_name = models.TextField()
    supplier_name = models.TextField()
    industry_name = models.TextField()
    branch_area = models.TextField()
    consumer_comment = models.TextField()
    comment_nature = models.TextField()
    incident = models.DateField()
    comment_datetime = models.DateField()
    class Meta:
        managed = False
        db_table = 'customerReviews_consumerreports'

class CustomerreviewsServicereportsgeocodedextended(models.Model):
    comment_id = models.BigIntegerField(primary_key=True)
    consumer_name = models.TextField()
    supplier_name = models.TextField()
    industry_name = models.TextField()
    branch_area = models.TextField()
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    incident = models.TextField()
    consumer_comment = models.TextField()
    comment_nature = models.TextField()
    comment_datetime = models.DateTimeField(blank=True, null=True)
    comment_score = models.IntegerField(blank=True, null=True)
    province = models.TextField()
    class Meta:
        managed = False
        db_table = 'customerReviews_servicereportsgeocodedextended'
    def as_json(self):
        return dict(
            supplier_name=self.supplier_name.replace('...','').replace('..','').upper(), 
            industry_name=self.industry_name.replace('...','').replace('..','').upper(),
            branch_area=self.branch_area, 
            latitude = self.latitude,
            longitude = self.longitude,
            comment_datetime =self.comment_datetime.isoformat(),
            province = self.province,
            consumer_comment =self.consumer_comment.replace('<br>','').replace('<em>','').replace('<div>','').lower())

class DjangoAdminLog(models.Model):
    id = models.IntegerField(primary_key=True)
    action_time = models.DateTimeField()
    user = models.ForeignKey(AuthUser)
    content_type = models.ForeignKey('DjangoContentType', blank=True, null=True)
    object_id = models.TextField(blank=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    class Meta:
        managed = False
        db_table = 'django_admin_log'

class DjangoContentType(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    class Meta:
        managed = False
        db_table = 'django_content_type'

class DjangoSession(models.Model):
    session_key = models.CharField(max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()
    class Meta:
        managed = False
        db_table = 'django_session'

class Servicereports(models.Model):
    comment_id = models.BigIntegerField(primary_key=True)
    consumer_name = models.TextField(blank=True)
    supplier_name = models.TextField(blank=True)
    industry_name = models.TextField(blank=True)
    branch_area = models.TextField(blank=True)
    incident = models.TextField(blank=True)
    consumer_comment = models.TextField(blank=True)
    comment_nature = models.TextField(blank=True)
    comment_datetime = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'servicereports'

class Servicereportsgeocoded(models.Model):
    comment_id = models.BigIntegerField(primary_key=True)
    consumer_name = models.TextField(blank=True)
    supplier_name = models.TextField(blank=True)
    industry_name = models.TextField(blank=True)
    branch_area = models.TextField(blank=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    incident = models.TextField(blank=True)
    consumer_comment = models.TextField(blank=True)
    comment_nature = models.TextField(blank=True)
    comment_datetime = models.DateTimeField(blank=True, null=True)
    comment_score = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'servicereportsgeocoded'

class Servicereportsgeocodedextended(models.Model):
    comment_id = models.BigIntegerField(primary_key=True)
    consumer_name = models.TextField(blank=True)
    supplier_name = models.TextField(blank=True)
    industry_name = models.TextField(blank=True)
    branch_area = models.TextField(blank=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    incident = models.TextField(blank=True)
    consumer_comment = models.TextField(blank=True)
    comment_nature = models.TextField(blank=True)
    comment_datetime = models.DateTimeField(blank=True, null=True)
    comment_score = models.IntegerField(blank=True, null=True)
    province = models.TextField(blank=True)
    class Meta:
        managed = False
        db_table = 'servicereportsgeocodedextended'
    def as_json(self):
        return dict(
            supplier_name=self.supplier_name.replace('...','').replace('..','').upper(), 
            industry_name=self.industry_name.replace('...','').replace('..','').upper(),
            branch_area=self.branch_area, 
            latitude = self.latitude,
            longitude = self.longitude,
            comment_datetime =self.comment_datetime.isoformat(),
            province = self.province,
            consumer_comment =self.consumer_comment.replace('<br>','').replace('<em>','').replace('<div>','').lower())

class Servicereportsgeolocatedscored(models.Model):
    comment_id = models.BigIntegerField(primary_key=True)
    consumer_name = models.TextField(blank=True)
    supplier_name = models.TextField(blank=True)
    industry_name = models.TextField(blank=True)
    branch_area = models.TextField(blank=True)
    incident = models.TextField(blank=True)
    consumer_comment = models.TextField(blank=True)
    comment_nature = models.TextField(blank=True)
    comment_score = models.TextField(blank=True)
    comment_datetime = models.DateTimeField(blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'servicereportsgeolocatedscored'
        
class Word2VecMapping(object):
    @staticmethod
    def report_to_wordlist(report):
        # Function to convert document text to a sequence of words,
        # optionally removing stop words.  Returns a list of words.

        # Remove HTML tags and related
        report_text = BeautifulSoup(report).get_text()
    
        # Remove non-letters
        report_text = re.sub("[^a-zA-Z]"," ", report_text)
       
        # Convert words to lower case and split them
        words = report_text.lower().split()
        myStops = ["any", "my","like","another","one","two","else","bras","ago","cos","get","yet","k","go", "every", "sort", "push","pull"]

        stoplist = set(stopwords.words("english") + myStops)
        words = [w for w in words if (not w in stoplist and len(w)>3)]
        
        wordListTuple = Counter(words).most_common()
        
        
        listofWords = [[tuple[0],tuple[1]] for tuple in wordListTuple]
       
        #print listofWords
        #lisofWords = map(list, wordListTuple)    
        # Return a list of words
        return listofWords

class Servicereportsscoredextended(models.Model):
    comment_id = models.BigIntegerField(primary_key=True)
    consumer_name = models.TextField(blank=True)
    supplier_name = models.TextField(blank=True)
    industry_name = models.TextField(blank=True)
    branch_area = models.TextField(blank=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    incident = models.TextField(blank=True)
    consumer_comment = models.TextField(blank=True)
    comment_nature = models.TextField(blank=True)
    comment_score = models.TextField(blank=True)
    comment_datetime = models.DateTimeField(blank=True, null=True)
    province = models.TextField(blank=True)
    comment_sentiment = models.TextField(blank=True)
    
    class Meta:
        managed = False
        db_table = 'servicereportsscoredextended'
    def as_json(self):
        self.comment_wordFreq = Word2VecMapping.report_to_wordlist(self.consumer_comment)
        return dict(
            supplier_name=self.supplier_name.replace('...','').replace('..','').upper(), 
            industry_name=self.industry_name.replace('...','').replace('..','').upper(),
            branch_area=self.branch_area, 
            latitude = self.latitude,
            longitude = self.longitude,
            comment_datetime =self.comment_datetime.isoformat(),
            province = self.province,
            comment_score = self.comment_score,
            consumer_comment =self.consumer_comment.replace('<br>','').replace('<em>','').replace('<div>','').lower(),
            comment_sentiment = self.comment_sentiment,
            comment_wordFreq = self.comment_wordFreq,
            consumer_name = self.consumer_name)

