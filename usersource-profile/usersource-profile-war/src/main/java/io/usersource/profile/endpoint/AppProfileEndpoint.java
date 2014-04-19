package io.usersource.profile.endpoint;

import io.usersource.profile.Constants;

import javax.inject.Named;

import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;

@Api(name = "appProfile", version = "v1", scopes = { Constants.EMAIL_SCOPE }, clientIds = {
		Constants.WEB_CLIENT_ID, Constants.API_EXPLORER_CLIENT_ID })
public class AppProfileEndpoint {

	@ApiMethod(name = "uploadAppIcon", path = "uploadAppIcon", httpMethod = "post")
	public void uploadAppIcon(@Named("appName") String appName,
			@Named("appVersion") String appVersion,
			@Named("appIconData") byte[] appIconData) {
		Entity app = new Entity("AppInfo");
		app.setProperty("appName", appName);
		app.setProperty("appVersion", appIconData);
		app.setProperty("appIcon", appIconData);

		DatastoreService datastore = DatastoreServiceFactory
				.getDatastoreService();
		datastore.put(app);
	}

}
