# from __future__ import division
import sys
from textblob import TextBlob
from textblob.sentiments import NaiveBayesAnalyzer
from textblob.classifiers import NaiveBayesClassifier
import csv
def main():
    data =[]
    train =[]
    test =[] 
    with open('hellopeter_labelled.csv', 'rb') as csvfile:
        spamreader = csv.reader(csvfile, delimiter=',')
        spamreader = list(spamreader)
        for row in spamreader:
            if (row[13] =='strongly positive'): 
                data.append((row[8],'pos'))
            if (row[13] =='positive' ): 
                data.append((row[8],'pos'))
            if ( row[13] =='neutral' ): 
                data.append((row[8],'neu'))
            if ( row[13] =='negative'): 
                data.append((row[8],'neg'))
            if (row[13] =='strongly negative' ): 
                data.append((row[8],'neg'))
                
                
    train = data[:1000]
    test = data[1001:]
    
    for innf in test:
        print innf
            
    cl = NaiveBayesClassifier(train)
   
    for tnew in test: 
            print '%%%%%%%'
            print ' '
            print  tnew[0]
            print  tnew[1]
            print '%%%%%%%'
            print '#######'
            cl.classify(tnew[0])
            prob_class =  cl.prob_classify(tnew[0])
            print '----max prob---'
            print prob_class.max()
            print '-----+ve-----'
            print prob_class.prob("pos")
            print '-----neutral-----'
            print prob_class.prob("neu")
            print '------ve-----'
            print prob_class.prob("neg")
            
    cl.accuracy(test)
         
def test():
#cl = NaiveBayesClassifier(train)
    for rep in reports:
        rep_scored = TextBlob(rep,analyzer=NaiveBayesAnalyzer())
        print " "
        print "-----"
        print rep_scored.sentiment
        

if __name__ == '__main__':
    main()
