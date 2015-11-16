#!/usr/bin/python3.4
# -*- coding: utf-8 -*-
import sys
import re
from bs4 import BeautifulSoup
import csv
import geocoder
import requests

# enable debugging
import cgitb
cgitb.enable()

def uprint(*objects, sep=' ', end='\n', file=sys.stdout):
    enc = file.encoding
    if enc == 'UTF-8':
        print(*objects, sep=sep, end=end, file=file)
    else:
        f = lambda obj: str(obj).encode(enc, errors='backslashreplace').decode(enc)
        print(*map(f, objects), sep=sep, end=end, file=file)

# check the dep & arr time & from to from the id details <div>
#<p class="flush">9:39 AM</p><h6 class="color--neutral flush">31 Jurong West Street 41, Singapore</h6>

def bs_extract(filename):
	#f = open(filename, encoding="utf-8")
	soup = BeautifulSoup(filename, "html.parser")
	allTR = soup.find_all("tr", class_="trip-expand__origin")
	id = re.compile('data-target=\"#(\S+)\" ')
	allTrip = []
	eachTrip = []
	error = 0
	for a in allTR:				
		if 'Canceled' not in str(a.contents):
			try:
				eachTrip = []
				eachTrip.append(id.findall(str(a))[0])
				details = soup.find_all("div", id=id.findall(str(a))[0])
				date = a.contents[1].contents
				name = a.contents[2].contents
				
				amts = a.contents[3].contents
				#There could be additional signs next to amount, need to remove those.
				for each in amts:
					if "<" not in each:
						amt = each
				type = a.contents[4].contents
				city = a.contents[5].contents
				
				match = re.search(r'([\D]+)([\d,.]+)', str(amt))#currMatch.findall(str(amt))
				eachTrip.extend(date)
				eachTrip.extend(name)
				eachTrip.append(match.group(1))
				eachTrip.append(float(match.group(2).replace(",","")))
				eachTrip.extend(type)
				eachTrip.extend(city)
				for d in details:
					f = d.contents[0].contents[0].contents[1].contents[3]
					fromTime = f.contents[0].contents[2].contents[0].contents
					fromDest = f.contents[0].contents[2].contents[1].contents
					toTime = f.contents[1].contents[1].contents[0].contents
					toDest = f.contents[1].contents[1].contents[1].contents
					eachTrip.extend(fromTime)
					eachTrip.extend(fromDest)
					eachTrip.extend(toTime)
					eachTrip.extend(toDest)
					eachTrip.append(geocoder.google(eachTrip[8]).latlng)
					eachTrip.append(geocoder.google(eachTrip[10]).latlng)
				allTrip.append(eachTrip)
			except IndexError:
				error = 1 #do nothing
	if (allTrip):
		return(allTrip)
	elif (error == 1):
		return("Error")
	else :
		return("Zero")

def main():
	args = sys.argv[1:]
	if not args:
		print ('usage: file ')
		sys.exit(1)

	username = args[0]
	password = args[1]
	s=requests.Session()
	headers={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36"}
	s.headers.update(headers)
	r = s.get("https://login.uber.com/login", verify=False)
	soup=BeautifulSoup(r.content,"html.parser")
	token=soup.find("input",{"name":"_csrf_token"})['value']
	data={"_csrf_token":token,
	"email":username,
	"password":password}
	login_url="https://login.uber.com/login"
	r=s.post(login_url,headers=headers,data=data,verify=False)
	soup=BeautifulSoup(r.content,"html.parser")
	invalidLogin = soup.find("h4", class_="login-error")
	if(invalidLogin): trips = "Invalid"
	else: trips = bs_extract(r.content)
	uprint(trips)
#http://www.taxifarefinder.com/main.php?city=Singapore&from=753+Tyersall+Ave+Singapore+257700&to=33+Jurong+West+Street+41+Singapore+649413
if __name__ == '__main__':
  main()

