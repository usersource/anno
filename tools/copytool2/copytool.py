from source import SourceServer
from target import TargetServer


source = SourceServer()
target = TargetServer()    

item = source.getNextItem()

while item != None:
    target.SaveObject(item)
    item = source.getNextItem()
   
print "Done!!!"