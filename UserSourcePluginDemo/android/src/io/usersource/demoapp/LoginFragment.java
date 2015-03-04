package io.usersource.demoapp;

import io.usersource.annoplugin.AnnoSingleton;
import io.usersource.annoplugin.shake.ShakeEnabler;
import io.usersource.demoapp.adapter.GridViewAdapter;
import io.usersource.demoapp.helper.AppConstant;
import io.usersource.demoapp.helper.Utils;

import java.util.ArrayList;
import java.util.Arrays;


import com.facebook.Request;
import com.facebook.RequestBatch;
import com.facebook.Response;
import com.facebook.Session;
import com.facebook.SessionState;
import com.facebook.UiLifecycleHelper;
import com.facebook.model.GraphUser;
import com.facebook.widget.LoginButton;

import android.content.Intent;
import android.content.res.Resources;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.GridView;

public class LoginFragment extends Fragment {
	private static final String TAG = "LoginFragment";
	private UiLifecycleHelper uiHelper;
	private AnnoSingleton anno = null;

	LoginButton authButton;
	static SessionState sessionState;

	String name, email, image_url;

	private ArrayList<String> imagePaths = new ArrayList<String>();
    private GridViewAdapter adapter;
    private GridView gridView;
    private int columnWidth;

	@Override
	public void onCreate(Bundle savedInstanceState) {
	    super.onCreate(savedInstanceState);
	    uiHelper = new UiLifecycleHelper(getActivity(), callback);
	    uiHelper.onCreate(savedInstanceState);
	    anno = AnnoSingleton.getInstance(getActivity());
	    ShakeEnabler.startListening(getActivity());
	}

	@Override
	public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
		View view = inflater.inflate(R.layout.main, container, false);

		authButton = (LoginButton) view.findViewById(R.id.authButton);
		authButton.setReadPermissions(Arrays.asList("public_profile", "email"));
		authButton.setFragment(this);

		gridView = (GridView) view.findViewById(R.id.gridView);
        InitilizeGridLayout();
        imagePaths = Utils.getInstance(getActivity()).getFilePaths();
        adapter = new GridViewAdapter(getActivity(), imagePaths, columnWidth);
        gridView.setAdapter(adapter);

		return view;
	}

	private void InitilizeGridLayout() {
		Resources r = getResources();
		float padding = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, AppConstant.GRID_PADDING, r.getDisplayMetrics());

		int screenWidth = Utils.getInstance(getActivity()).getScreenWidth();
		columnWidth = (int) ((screenWidth - ((AppConstant.NUM_OF_COLUMNS + 1) * padding)) / AppConstant.NUM_OF_COLUMNS);

		gridView.setNumColumns(AppConstant.NUM_OF_COLUMNS);
		gridView.setColumnWidth(columnWidth);
		gridView.setStretchMode(GridView.NO_STRETCH);
		gridView.setPadding((int) padding, (int) padding, (int) padding, (int) padding);
		gridView.setHorizontalSpacing((int) padding);
		gridView.setVerticalSpacing((int) padding);
	}

	private void onSessionStateChange(SessionState state) {
		sessionState = state;
		LoginActivity.updateMenuItemTitle(null);
	    if (state.isOpened()) {
	        Log.i(TAG, "Logged in...");
	        anno.setupWithUserInfo(email, name, image_url, "io.usersource.demo", "usersource");
	    } else if (state.isClosed()) {
	        Log.i(TAG, "Logged out...");
	        anno.setupAnonymousUserWithTeamCredentials("io.usersource.demo", "usersource");
	    }
	}

	private Session.StatusCallback callback = new Session.StatusCallback() {
	    @Override
		public void call(Session session, SessionState state, Exception exception) {
			sessionState = state;
			getUserInfo(session, state);
		}
	};

	private void getUserInfo(Session session, SessionState state) {
		if (state.isOpened()) {
			RequestBatch requestBatch = new RequestBatch();
			Request detailRequest = getUserProfileDetails(session);
			requestBatch.add(detailRequest);
			requestBatch.executeAsync();
		} else {
			onSessionStateChange(state);
		}
	}

	private Request getUserProfileDetails(Session session) {
		return Request.newMeRequest(session, new Request.GraphUserCallback() {
            @Override
            public void onCompleted(GraphUser user, Response response) {
                if (response != null) {
                    try {
                        name = user.getName();
                        email = (String) user.getProperty("email");
						image_url = "http://graph.facebook.com/" + user.getId() + "/picture";
                        Log.d(TAG, "Name: " + name);
                        Log.d(TAG, "Email: " + email);
                        Log.d(TAG, "Image URL: " + image_url);
                        onSessionStateChange(sessionState);
                    } catch (Exception e) {
                        e.printStackTrace();
                        Log.e(TAG, "Exception e");
                    }
                }
            }
        });
	}

	@Override
	public void onResume() {
	    super.onResume();

	    Session session = Session.getActiveSession();
		if (session != null && (session.isOpened() || session.isClosed())) {
			sessionState = session.getState();
			LoginActivity.updateMenuItemTitle(null);
		}

	    uiHelper.onResume();
	}

	@Override
	public void onActivityResult(int requestCode, int resultCode, Intent data) {
	    super.onActivityResult(requestCode, resultCode, data);
	    uiHelper.onActivityResult(requestCode, resultCode, data);
	}

	@Override
	public void onPause() {
	    super.onPause();
	    uiHelper.onPause();
	}

	@Override
	public void onDestroy() {
	    super.onDestroy();
	    uiHelper.onDestroy();
	}

	@Override
	public void onSaveInstanceState(Bundle outState) {
	    super.onSaveInstanceState(outState);
	    uiHelper.onSaveInstanceState(outState);
	}

}
