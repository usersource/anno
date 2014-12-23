package io.usersource.demoapp.helper;


import java.io.File;
import java.util.ArrayList;
import java.util.Locale;

import android.content.Context;
import android.os.Environment;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.WindowManager;

public class Utils {
	private static Utils instance = null;
	private static Context _context;
	public static ArrayList<String> filePaths;

	public Utils() {
	}

	public static Utils getInstance(Context context) {
		if (instance == null) {
			instance = new Utils();
			_context = context;
		}
		return instance;
	}

	public ArrayList<String> getFilePaths() {
		if (filePaths == null) {
			filePaths = new ArrayList<String>();

			File directory = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);

			if (directory.isDirectory()) {
				File[] listFiles = directory.listFiles();
				if (listFiles.length > 0) {
					for (File file : listFiles) {
						if (file.isDirectory()) {
							File[] listSubFiles = file.listFiles();
							if (listSubFiles.length > 0) {
								for (File subFile : listSubFiles) {
									String filePath = subFile.getAbsolutePath();
									if (IsSupportedFile(filePath)) {
										filePaths.add(filePath);
									}
								}
							}
						}
					}
				}
			}
		}

		return filePaths;
	}

	private boolean IsSupportedFile(String filePath) {
		String ext = filePath.substring((filePath.lastIndexOf(".") + 1), filePath.length());
		return (AppConstant.FILE_EXTN.contains(ext.toLowerCase(Locale.getDefault())));
	}

	public int getScreenWidth() {
		DisplayMetrics displayMetrics = new DisplayMetrics();
		WindowManager wm = (WindowManager) _context.getSystemService(Context.WINDOW_SERVICE);
		Display display = wm.getDefaultDisplay();
		display.getMetrics(displayMetrics);
		return displayMetrics.widthPixels;
	}
}
