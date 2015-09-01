# from __future__ import division
import sys
import json
import time
import numpy as np
import psycopg2
from datetime import date, datetime, timedelta
import nltk
import json
import unicodedata
import re
from dateutil import parser




# Created on Jul 10, 2014
# 
# @author: dlunga

def perdelta(start, end, delta): # function that returns a date range with hourly resolution
    curr = start # source: http://stackoverflow.com/questions/10688006/generate-a-list-of-datetimes-between-an-interval-in-python
    while curr < end:
        yield curr
        curr += delta
        
def formatTime(time, type):
    if type == 'hours':
        return time.replace(minute=0, second=0) # remove the minutes and seconds
    elif type == 'minutes':
        return time.replace(second=0)
    
def getDateRange(length, type, d): # will add this code if we are reading streaming data
    date_list = []
    h = d.hour
    
    if type == 'hours':
        for result in perdelta(d, d.replace(hour=0) + timedelta(days=length), timedelta(hours=1)):
            date_list.append(result)
    elif type == 'minutes':
        for result in perdelta(d, d.replace(hour=h) + timedelta(hours=length), timedelta(minutes=1)):
            date_list.append(result)
        
    return date_list

    
def compute_sentiments(sentfile,search_results):
    #tweet_id, tweet, lang, tweet_geo
    scores = {} 
    for line in sentfile:
        term, score  = line.split("\t")
        scores[term] = int(score)  
    
    sent_keys = scores.keys()
    geo_dict ={}
    pos = 0
    neg = 0
    net =0
    for twt_line in search_results:
        tweet_id = twt_line[0]
        tweet = twt_line[2]
        lang = twt_line[3]
#         print type(lang)
        
        tweet_geo = twt_line[4]
        if lang.encode('utf-8') == 'en':
            words = tweet.encode('utf-8').split()
            twt_score = 0
            for w in words:
                if w in sent_keys:
                    twt_score += scores[w]
            if twt_score > 0:
                geo_dict[tweet_id] = [tweet_geo, "green"]
                pos += 1
            elif twt_score < 0:
                geo_dict[tweet_id] = [tweet_geo, "red"]
                neg += 1
            else:
                geo_dict[tweet_id] = [tweet_geo, "orange"]
                net += 1
            #time.sleep(120)
            #print "----"
            #print "%s \t %s " % (input_line["text"].encode('utf-8'), twt_score)
    return (geo_dict, pos, neg,net)

def main(search_word, type, length, base_date):


#     geo_Sentiment = GeoSentiment.main(selected_value_query,selected_value_time,selected_how_long,selected_day,selected_month)
    geo_lon = []
    geo_lat = []
    geo_sentiment = []
    tweets = []
    tweet_data = []
    print search_word
    afinnfile = open("sentwords.txt")
    con = None
    tables = ['accidents','crime','disasters','economy','education','elections','eskom','flu','oscar','soccer','sports']
    time_list = getDateRange(length, type, base_date)
#     print time_list

    try: # CHANGE THIS!!!!!
        con = psycopg2.connect(database = 'twitterdb',  user = 'twitter', password='twitter', host='localhost')
        cur = con.cursor()
        
        if search_word == 'flu':
            cur.execute("SELECT tweet_id, tweet_datetime, tweet, lang, tweet_geo FROM " + tables[7] + " WHERE tweet ~ '"+search_word+"' ORDER BY tweet_datetime ASC  ") # sort table first 
        elif search_word == 'truck':
            cur.execute("SELECT tweet_id, tweet_datetime, tweet, lang, tweet_geo FROM " + tables[0] + " WHERE tweet ~ '"+search_word+"' ORDER BY tweet_datetime ASC  ") # sort table first
        elif search_word == 'brazil':
            cur.execute("SELECT tweet_id, tweet_datetime, tweet, lang, tweet_geo FROM " + tables[9] + " WHERE tweet ~ '"+search_word+"' ORDER BY tweet_datetime ASC  ") # sort table first
        elif search_word == 'oscar':
            cur.execute("SELECT tweet_id, tweet_datetime, tweet, lang, tweet_geo FROM " + tables[8] + " WHERE tweet ~ '"+search_word+"' ORDER BY tweet_datetime ASC  ") # sort table first
        elif search_word == 'vote':  
            cur.execute("SELECT tweet_id, tweet_datetime, tweet, lang, tweet_geo FROM " + tables[5] + " WHERE tweet ~ '"+search_word+"' ORDER BY tweet_datetime ASC  ") # sort table first
        elif search_word == 'eskom':
            cur.execute("SELECT tweet_id, tweet_datetime, tweet, lang, tweet_geo FROM " + tables[6] + " WHERE tweet ~ '"+search_word+"' ORDER BY tweet_datetime ASC  ") # sort table first
        
        tweet_file = cur.fetchall()        
        
#         for x in xrange(0, len(tables)): # search for query in each of the tables
#             cur.execute("SELECT tweet_id, tweet_datetime, tweet, lang, tweet_geo FROM  " + tables[x] + " WHERE tweet ~ '"+search_word+"' ORDER BY tweet_datetime ASC  ") # sort table first
#             tweet_file = cur.fetchall()
            
        
        for tweet_info in tweet_file:
            time = tweet_info[1]
#             print tweet_info[1]
            time = formatTime(time, type)
    
            if time in time_list:
                tweet_data.append(tweet_info)
                
        geo_dict, pos,neg,neut = compute_sentiments(afinnfile,tweet_data)   
        
        for line in tweet_data:
            if line[3].encode('utf-8') == 'en' and line[4] != "None":
                tweets.append(line[2].encode('utf-8'))
                
        for key in geo_dict.keys():
            if geo_dict[key][0] != "None":
                geo_dict[key][0] = geo_dict[key][0].replace("]",'').replace("[",'').split(",")
                geo_lon.append(float(geo_dict[key][0][0])) 
                geo_lat.append(float(geo_dict[key][0][1]))  
                geo_sentiment.append((geo_dict[key][1][0]))
            
    except psycopg2.DatabaseError, e:
        print 'Error %s' % e
        sys.exit(1)
     
    finally:
            if con:
                con.close()
#     print len(tweets)
#     print len(geo_lat)
#     print len(geo_lon)
    print geo_sentiment
    return (geo_lon,geo_lat,geo_sentiment,tweets,pos,neg,neut)

if __name__ == '__main__':
    main(search_word, type, length, base_date)