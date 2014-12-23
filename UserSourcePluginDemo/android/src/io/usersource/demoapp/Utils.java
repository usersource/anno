package io.usersource.demoapp;

import java.io.File;
import java.util.ArrayList;
import java.util.Locale;

import android.content.Context;
import android.graphics.Point;
import android.os.Environment;
import android.view.Display;
import android.view.WindowManager;

public class Utils {
	private Context _context;

	public Utils(Context context) {
		this._context = context;
	}

	public ArrayList<String> getFilePaths() {
		ArrayList<String> filePaths = new ArrayList<String>();

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

		return filePaths;
	}

	private boolean IsSupportedFile(String filePath) {
		String ext = filePath.substring((filePath.lastIndexOf(".") + 1), filePath.length());

		if (AppConstant.FILE_EXTN.contains(ext.toLowerCase(Locale.getDefault())))
			return true;
		else
			return false;

	}

	@SuppressWarnings("deprecation")
	public int getScreenWidth() {
		int columnWidth;
		WindowManager wm = (WindowManager) _context.getSystemService(Context.WINDOW_SERVICE);
		Display display = wm.getDefaultDisplay();

		final Point point = new Point();
		try {
			display.getSize(point);
		} catch (java.lang.NoSuchMethodError ignore) { // Older device
			point.x = display.getWidth();
			point.y = display.getHeight();
		}
		columnWidth = point.x;
		return columnWidth;
	}
}
