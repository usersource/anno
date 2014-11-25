from bottle import *

outputfile = '/home/ignite/datacollector/output/timestamp.csv'

ordered_list = ['date', "testname","email", "deviceReady", "DBInitDone", "buildApp", "indexInit", "beforeAuth", "AuthDone", "AnnoDone", "totaltime" ]

@route(method="POST")
def update():
	values = []
	for key in ordered_list:
		values.append(request.POST.get(key,""))
	with open(outputfile,"a") as f:
		print >> f, ','.join(values)
	return values

@route()
def reset():
	with open(outputfile, "w") as f:
		print >> f, ','.join(ordered_list)

@route()
def titles():
	with open(outputfile, "a") as f:
		print >> f, ','.join(ordered_list)

    
@route()
def retrieve():
	with open(outputfile, "r") as f:
		content = f.read();
	return [ content ]

application = default_app()

if __name__ == "__main__":
	run(host="atlas.ignitesol.com", port=8000)

