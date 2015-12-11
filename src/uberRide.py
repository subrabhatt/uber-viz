#!/usr/bin/python3.4
# -*- coding: utf-8 -*-
import sys
import re
from bs4 import BeautifulSoup
#import csv
import geocoder
import requests

# enable debugging
import cgitb
cgitb.enable()

# declare global variables
global exchangeRate
global allTrip
global cCode
cCode={'AF':'AFN','AL':'ALL','DZ':'DZD','AS':'USD','AD':'EUR','AO':'AOA','AI':'XCD','AQ':'XCD','AG':'XCD','AR':'ARS','AM':'AMD','AW':'AWG','AU':'AUD','AT':'EUR','AZ':'AZN','BS':'BSD','BH':'BHD','BD':'BDT','BB':'BBD','BY':'BYR','BE':'EUR','BZ':'BZD','BJ':'XOF','BM':'BMD','BT':'BTN','BO':'BOB','BA':'BAM','BW':'BWP','BV':'NOK','BR':'BRL','IO':'USD','BN':'BND','BG':'BGN','BF':'XOF','BI':'BIF','KH':'KHR','CM':'XAF','CA':'CAD','CV':'CVE','KY':'KYD','CF':'XAF','TD':'XAF','CL':'CLP','CN':'CNY','CX':'AUD','CC':'AUD','CO':'COP','KM':'KMF','CG':'XAF','CD':'CDF','CK':'NZD','CR':'CRC','HR':'HRK','CU':'CUP','CY':'EUR','CZ':'CZK','DK':'DKK','DJ':'DJF','DM':'XCD','DO':'DOP','EC':'ECS','EG':'EGP','SV':'SVC','GQ':'XAF','ER':'ERN','EE':'EUR','ET':'ETB','FK':'FKP','FO':'DKK','FJ':'FJD','FI':'EUR','FR':'EUR','GF':'EUR','TF':'EUR','GA':'XAF','GM':'GMD','GE':'GEL','DE':'EUR','GH':'GHS','GI':'GIP','GB':'GBP','GR':'EUR','GL':'DKK','GD':'XCD','GP':'EUR','GU':'USD','GT':'QTQ','GG':'GGP','GN':'GNF','GW':'GWP','GY':'GYD','HT':'HTG','HM':'AUD','HN':'HNL','HK':'HKD','HU':'HUF','IS':'ISK','IN':'INR','ID':'IDR','IR':'IRR','IQ':'IQD','IE':'EUR','IM':'GBP','IL':'ILS','IT':'EUR','CI':'XOF','JM':'JMD','JP':'JPY','JE':'GBP','JO':'JOD','KZ':'KZT','KE':'KES','KI':'AUD','KP':'KPW','KR':'KRW','KW':'KWD','KG':'KGS','LA':'LAK','LV':'LVL','LB':'LBP','LS':'LSL','LR':'LRD','LY':'LYD','LI':'CHF','LT':'LTL','LU':'EUR','MO':'MOP','MK':'MKD','MG':'MGF','MW':'MWK','MY':'MYR','MV':'MVR','ML':'XOF','MT':'EUR','MH':'USD','MQ':'EUR','MR':'MRO','MU':'MUR','YT':'EUR','MX':'MXN','FM':'USD','MD':'MDL','MC':'EUR','MN':'MNT','ME':'EUR','MS':'XCD','MA':'MAD','MZ':'MZN','MM':'MMK','NA':'NAD','NR':'AUD','NP':'NPR','NL':'EUR','AN':'ANG','NC':'XPF','NZ':'NZD','NI':'NIO','NE':'XOF','NG':'NGN','NU':'NZD','NF':'AUD','MP':'USD','NO':'NOK','OM':'OMR','PK':'PKR','PW':'USD','PA':'PAB','PG':'PGK','PY':'PYG','PE':'PEN','PH':'PHP','PN':'NZD','PL':'PLN','PF':'XPF','PT':'EUR','PR':'USD','QA':'QAR','RE':'EUR','RO':'RON','RU':'RUB','RW':'RWF','SH':'SHP','KN':'XCD','LC':'XCD','PM':'EUR','VC':'XCD','WS':'WST','SM':'EUR','ST':'STD','SA':'SAR','SN':'XOF','RS':'RSD','SC':'SCR','SL':'SLL','SG':'SGD','SK':'EUR','SI':'EUR','SB':'SBD','SO':'SOS','ZA':'ZAR','GS':'GBP','SS':'SSP','ES':'EUR','LK':'LKR','SD':'SDG','SR':'SRD','SJ':'NOK','SZ':'SZL','SE':'SEK','CH':'CHF','SY':'SYP','TW':'TWD','TJ':'TJS','TZ':'TZS','TH':'THB','TG':'XOF','TK':'NZD','TO':'TOP','TT':'TTD','TN':'TND','TR':'TRY','TM':'TMT','TC':'USD','TV':'AUD','UK':'GBP','UG':'UGX','UA':'UAH','AE':'AED','UY':'UYU','US':'USD','UM':'USD','UZ':'UZS','VU':'VUV','VA':'EUR','VE':'VEF','VN':'VND','VG':'USD','VI':'USD','WF':'XPF','EH':'MAD','YE':'YER','ZM':'ZMW','ZW':'ZWD'}

#get the latest exchange rate
def get_rate():
	resp = requests.get('https://openexchangerates.org/api/latest.json?app_id=bd31184ed41743d1b43250c9239a409a')
	global exchangeRate
	exchangeRate = resp.json()['rates']
	return exchangeRate

#I am not using it any longer, needed for printing special chars.
def uprint(*objects, sep=' ', end='\n', file=sys.stdout):
    enc = file.encoding
    if enc == 'UTF-8':
        print(*objects, sep=sep, end=end, file=file)
    else:
        f = lambda obj: str(obj).encode(enc, errors='backslashreplace').decode(enc)
        print(*map(f, objects), sep=sep, end=end, file=file)

#extact the html information using bs4
def bs_extract(htmlData):
	#get the global exchange rate first.
	get_rate()
	soup = BeautifulSoup(htmlData, "html.parser")
	allTR = soup.find_all("tr", class_="trip-expand__origin")
	id = re.compile('data-target=\"#(\S+)\" ')
	global allTrip
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
				g = geocoder.google(str(city))
				currCode = cCode[g.country]

				match = re.search(r'([\D]+)([\d,.]+)', str(amt))
				eachTrip.extend(date)
				eachTrip.extend(name)
				eachTrip.append(currCode)
				amt = float(match.group(2).replace(",",""))
				eachTrip.append(amt)
				eachTrip.extend(type)
				eachTrip.extend(city)
				for d in details:
					f = d.contents[0].contents[0].contents[1].contents[3]
					fromTime = f.contents[0].contents[2].contents[0].contents
					fromDest = f.contents[0].contents[2].contents[1].contents
					toTime = f.contents[1].contents[1].contents[0].contents
					toDest = f.contents[1].contents[1].contents[1].contents
					fromLatlng = geocoder.google(str(fromDest)).latlng
					toLatlng = geocoder.google(str(toDest)).latlng
					eachTrip.extend(fromTime)
					eachTrip.extend(fromDest)
					eachTrip.extend(toTime)
					eachTrip.extend(toDest)
					eachTrip.append(fromLatlng)
					eachTrip.append(toLatlng)					
					amt = round(amt/exchangeRate[currCode],2)
					eachTrip.append(amt)
					taxiFare = find_fare(fromLatlng,toLatlng)
					eachTrip.append(taxiFare[0])
					eachTrip.append(taxiFare[1])
					taxiAmt = round(taxiFare[1]/exchangeRate[currCode],2)
					eachTrip.append(taxiAmt)
					eachTrip.append(round(taxiAmt-amt,2))

				allTrip.append(eachTrip)
			except IndexError:
				error = 1 #do nothing
	if (allTrip):
		return(allTrip)
	elif (error == 1):
		return("Error")
	else :
		return("Zero")

#function to get the fare & exchange rate calculated correctly
#using all the trip, get the fare & currency for the trip
# if no fare is found, return 0
def find_fare(fromLatlng,toLatlng):
	origin = str(fromLatlng[0])+","+str(fromLatlng[1])
	destination = str(toLatlng[0])+','+str(toLatlng[1])
	url='https://api.taxifarefinder.com/fare?key=n5m6Brethuhe&origin='+origin+'&destination='+destination
	resp = requests.get(url)
	retVal = [0,0]
	item=resp.json()
	if(item['status'] == 'OK'):
		retVal[0] = (item['distance'])
		retVal[1] = (item['total_fare'])
	return retVal

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

