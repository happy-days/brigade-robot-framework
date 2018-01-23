#!/usr/bin/python

import re
import os

def Parse_IP (bufferOutput):
    strOutput = str(bufferOutput)
    ip = str(re.findall( r'[0-9]+(?:\.[0-9]+){3}', strOutput )[0])
    return ip

def Parse_Rows (bufferOutput):
    f=open('/tmp/newfile.txt','w+')
    f.write(bufferOutput)
    f.close()
    filehandler=open('/tmp/newfile.txt','rw')
    lines = filehandler.readlines()
    f.close()
    count = 0
    for line in lines:
        if line.split(' ')[0].isdigit():
            count= count + 1
    if (count > 1):
        multi = 'true'
        return multi
