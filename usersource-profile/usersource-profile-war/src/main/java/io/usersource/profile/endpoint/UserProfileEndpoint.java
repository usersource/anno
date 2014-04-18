package io.usersource.profile.endpoint;

import io.usersource.profile.Constants;
import io.usersource.profile.model.App;
import io.usersource.profile.model.AppList;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.config.ApiMethod.HttpMethod;
import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.UnauthorizedException;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.users.User;

@Api(name = "userProfile", version = "v1", scopes = { Constants.EMAIL_SCOPE }, clientIds = {
		Constants.WEB_CLIENT_ID, Constants.API_EXPLORER_CLIENT_ID })
public class UserProfileEndpoint {

	private static final Logger log = Logger
			.getLogger(UserProfileEndpoint.class.getName());

	@ApiMethod(name = "getInstalledAppList", path = "getInstalledAppList", httpMethod = HttpMethod.GET)
	public AppList getInstalledAppsForUser(User user)
			throws UnauthorizedException {
		if (user == null) {
			throw new UnauthorizedException(Messages.NO_PERMISSION);
		}
		String email = user.getEmail();

		AppList appList = new AppList();
		List<App> apps = new ArrayList<App>();
		DatastoreService datastore = DatastoreServiceFactory
				.getDatastoreService();
		Filter filter = new FilterPredicate("email", FilterOperator.EQUAL,
				email);
		Query query = new Query("InstalledApp").setFilter(filter);
		Iterable<Entity> entityIterator = datastore.prepare(query).asIterable();
		for (Entity entity : entityIterator) {
			App app = new App((String) entity.getProperty("appName"),
					(String) entity.getProperty("appVersion"));
			apps.add(app);
		}
		appList.setAppList(apps);
		return appList;
	}

	@ApiMethod(name = "updateInstalledApp", path = "updateInstalledApp", httpMethod = HttpMethod.POST)
	public void updateInstalledAppsForUser(User user, AppList appList)
			throws UnauthorizedException, BadRequestException {
		if (user == null) {
			throw new UnauthorizedException(Messages.NO_PERMISSION);
		}
		String email = user.getEmail();
		if (appList == null) {
			throw new BadRequestException(String.format(
					Messages.FIELD_REQUIRED, "appList"));
		}
		List<App> apps = appList.getAppList();
		if (apps != null && apps.size() > 0) {
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();

			Filter filter = new FilterPredicate("email", FilterOperator.EQUAL,
					email);
			Query query = new Query("InstalledApp").setKeysOnly().setFilter(
					filter);
			List<Entity> entitiesWithOnlyKey = datastore.prepare(query).asList(
					FetchOptions.Builder.withDefaults());

			if (entitiesWithOnlyKey != null && entitiesWithOnlyKey.size() > 0) {
				deleteAppsForUser(email, datastore, entitiesWithOnlyKey);
			} else {
				log.info("No apps for " + email + ", no need to delete.");
			}
			insertAppsForUser(email, apps, datastore);
		}
	}

	private void insertAppsForUser(String email, List<App> apps,
			DatastoreService datastore) {
		log.info("insert new apps for " + email);
		List<Entity> entityListToPut = new ArrayList<Entity>();
		for (App app : apps) {
			Entity userApp = new Entity("InstalledApp");
			userApp.setProperty("email", email);
			userApp.setProperty("appName", app.getAppName());
			userApp.setProperty("appVersion", app.getAppVersion());
			entityListToPut.add(userApp);
		}
		datastore.put(entityListToPut);
		log.info("insert successfully.");
	}

	private void deleteAppsForUser(String email, DatastoreService datastore,
			List<Entity> entitiesWithOnlyKey) {
		log.info("delete " + entitiesWithOnlyKey.size() + " apps for " + email);
		List<Key> keys = new ArrayList<Key>();
		for (Entity entity : entitiesWithOnlyKey) {
			keys.add(entity.getKey());
		}
		datastore.delete(keys);
		log.info("delete successfully.");
	}
}
