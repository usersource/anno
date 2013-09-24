'''
Created on Aug 31, 2013

@author: sergey
'''

import webapp2

class SendPost(webapp2.RequestHandler):
    
    def get(self):
        self.response.out.write(self.proceedRequest())
        
    def post(self):
        self.response.out.write(self.proceedRequest())
        
    def  proceedRequest(self):
        result = " <!DOCTYPE HTML><html><head><title>Post request</title></head><body>\
<script type=\"text/javascript\">\n \
   function getXmlHttp()\n \
   {\n \
      var xmlhttp;\n \
      try\n \
      {\n \
        xmlhttp = new ActiveXObject(\"Msxml2.XMLHTTP\");\n \
      }\n \
      catch (e)\n \
      {\n \
         try\n \
         {\n \
            xmlhttp = new ActiveXObject(\"Microsoft.XMLHTTP\");\n \
         }\n \
         catch (E)\n \
         {\n \
            xmlhttp = false;\n \
         }\n  \
      }\n \
\
      if (!xmlhttp && typeof XMLHttpRequest!='undefined')\n \
      {\n \
         xmlhttp = new XMLHttpRequest();\n \
      }\n \
      return xmlhttp;\n \
   };\n \
  \n\
   function SendRequest()\n \
   {\n \
      var requst_type = document.getElementById(\"requestType\").value; \n\
      var anno_action = document.getElementById(\"anno_action\").value;\n\
      var feedback_key = document.getElementById(\"feedback_id\").value;\n\
      var comment = document.getElementById(\"comment\").value;\n\
\n\
      var request = {}\n\
      request[\"type\"] = requst_type\n\
      if(document.getElementById(\"anno_action\").style.display == \"\"){\n\
         request[\"action\"] = anno_action\n\
      }\n\
      request[\"feedback_key\"] = feedback_key\n\
      \n\
      if(document.getElementById(\"comment\").style.display == \"\"){\n\
         request[\"comment\"] = comment\n\
      }\n\
\n\
      var xmlhttp = getXmlHttp();\n \
      xmlhttp.open(\'POST\', \'community\', true);\n \
      xmlhttp.setRequestHeader(\'Content-Type\', \'application/x-www-form-urlencoded\');\n \
      document.getElementById(\"request\").innerHTML = \"<br>jsonRequest\" + JSON.stringify(request);\n \
      xmlhttp.send(\"jsonRequest=\" + encodeURIComponent(JSON.stringify(request)));\n \
\
      xmlhttp.onreadystatechange = function() \n\
      {\n \
         if (xmlhttp.readyState == 4) \n\
         {\n \
            if(xmlhttp.status == 200)\n \
            {\n \
               document.getElementById(\"response\").innerHTML = \"<br>\" + xmlhttp.responseText;\n \
            }\n \
         }\n \
      }\n \
    }\n\
    \
    function onTypeSelected()\n\
    {\n\
      var requst_type = document.getElementById(\"requestType\").value; \n\
      if(requst_type != \"followup\")\n\
      {\n\
         document.getElementById(\"comment\").style.display = \"None\"; \n\
         document.getElementById(\"comment_label\").style.display = \"None\"; \n\
         if(requst_type == \"getFlagsCount\" || requst_type == \"getFollowUpCount\" || requst_type == \"getVotesCount\" ){\n\
             document.getElementById(\"anno_action\").style.display = \"None\"; \n\
             document.getElementById(\"action_label\").style.display = \"None\"; \n\
         }\n\
         else{\n\
            document.getElementById(\"anno_action\").style.display = \"\"; \n\
            document.getElementById(\"action_label\").style.display = \"\"; \n\
         }\n\
      }\n\
      else\n\
      {\n\
          document.getElementById(\"anno_action\").style.display = \"\"; \n\
          document.getElementById(\"action_label\").style.display = \"\"; \n\
          document.getElementById(\"comment\").style.display = \"\";\
          document.getElementById(\"comment_label\").style.display = \"\";\
      }\n\
    }\n\
</script>\n \
\n\
<div>\n \
Request Type: <br>\n\
<select name=\"requestType\" id=\"requestType\" onclick=\"onTypeSelected()\" size=\"1\"> \
<option value=\"followup\">Follow up</option> \
<option value=\"Vote\">Vote</option> \
<option value=\"Flag\">Flag</option> \
<option value=\"getFlagsCount\">Flags count</option> \
<option value=\"getFollowUpCount\">Follow up count</option> \
<option value=\"getVotesCount\">Vote count</option> \
</select> \
<br /> <div id=\"action_label\">action:</div> \n\
<select name=\"anno_action\" id=\"anno_action\"  size=\"1\"> \
<option value=\"add\">Add</option> \
<option value=\"delete\">Delete</option> \
</select> \
<br /><div id=\"comment_label\"> comment:</div> \n\
<input type=\"text\" name=\"comment\" id=\"comment\" />\n \
<br /> feedback id:<br> \n\
<input type=\"text\" name=\"feedback_id\" id=\"feedback_id\" />\n \
<br />\n \
<input type=\"button\" value=\"Send\" onclick=\"SendRequest()\" />\n \
<p>Request is: <span id=\"request\"></span></p> \n\
<p>Response is: <span id=\"response\"></span></p> \n\
</div></body></html>"
        
        return result