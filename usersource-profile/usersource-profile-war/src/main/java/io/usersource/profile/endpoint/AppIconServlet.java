package io.usersource.profile.endpoint;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;

public class AppIconServlet extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 4377969290784958121L;

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		super.doGet(req, resp);
		String appName = req.getParameter("appName");
		if (appName == null || appName.isEmpty()) {
			resp.setStatus(400);
			resp.getOutputStream().print("appName parameter is missing.");
			return;
		}
		String appVersion = req.getParameter("appVersion");

		Query query = new Query("AppInfo");
		Filter appNameFilter = new FilterPredicate("appName",
				FilterOperator.EQUAL, appName);
		if (appVersion == null || appVersion.isEmpty()) {
			query = query.setFilter(appNameFilter);
		} else {
			Filter appVersionFilter = new FilterPredicate("appVersion",
					FilterOperator.EQUAL, appVersion);
			Filter compositeFilter = CompositeFilterOperator.and(appNameFilter,
					appVersionFilter);
			query = query.setFilter(compositeFilter);
		}

		DatastoreService datastore = DatastoreServiceFactory
				.getDatastoreService();
		Entity appInfo = datastore.prepare(query).asSingleEntity();
		byte[] data = (byte[]) appInfo.getProperty("appIcon");
		resp.getOutputStream().write(data);
	}

}
