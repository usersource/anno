'''
Created on Aug 25, 2013

@author: sergey
'''

class ReverseProxyServer():
    def __init__(self, application):
        self.application = application
        
    def __call__(self, env, start_response):
        real_host = env.get('HTTP_X_REAL_HOST')
        if real_host:
            env['HTTP_HOST'] = real_host
            env['SERVER_NAME'] = real_host
        real_ip = env.get('HTTP_X_REAL_IP')
        if real_ip:
            env['REMOTE_ADDR'] = real_ip
        return self.application(env, start_response)
