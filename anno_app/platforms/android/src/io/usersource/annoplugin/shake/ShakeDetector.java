package io.usersource.annoplugin.shake;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

public class ShakeDetector implements SensorEventListener {
	private static final int ACCELERATION_THRESHOLD = 13;

	private final ShakeQueue shakeQueue = new ShakeQueue();
	private final ShakeListener listener;

	private SensorManager sensorManager;
	private Sensor sensor;

	public ShakeDetector(ShakeListener listener) {
		this.listener = listener;
	}

	public boolean start(SensorManager sensorManager) {
		if (sensor != null) {
			return true;
		}

		sensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);

		if (sensor != null) {
			this.sensorManager = sensorManager;
			sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_FASTEST);
		}

		return sensor != null;
	}

	public void stop() {
		if (sensor != null) {
			sensorManager.unregisterListener(this, sensor);
			sensorManager = null;
			sensor = null;
		}
	}

	@Override
	public void onSensorChanged(SensorEvent event) {
		boolean accelerating = isAccelerating(event);
		long timestamp = event.timestamp;
		shakeQueue.add(timestamp, accelerating);
		if (shakeQueue.isShaking()) {
			shakeQueue.clear();
			try {
				listener.onDeviceShaked();
			} catch (InterruptedException e) {
				e.printStackTrace();
			} catch (ExecutionException e) {
				e.printStackTrace();
			}
		}
	}

	private boolean isAccelerating(SensorEvent event) {
		float ax = event.values[0];
		float ay = event.values[1];
		float az = event.values[2];
		final double magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
		return magnitude > ACCELERATION_THRESHOLD;
	}

	static class ShakeQueue {
		private static final long MAX_WINDOW_SIZE = 500000000; // 0.5s
		private static final long MIN_WINDOW_SIZE = MAX_WINDOW_SIZE >> 1; // 0.25s
		private static final int MIN_QUEUE_SIZE = 4;

		private final ShakePool shakePool = new ShakePool();

		private Shake oldest;
		private Shake newest;
		private int sampleCount;
		private int acceleratingCount;

		void add(long timestamp, boolean accelerating) {
			purge(timestamp - MAX_WINDOW_SIZE);

			Shake added = shakePool.acquire();
			added.timestamp = timestamp;
			added.accelerating = accelerating;
			added.next = null;
			if (newest != null) {
				newest.next = added;
			}
			newest = added;
			if (oldest == null) {
				oldest = added;
			}

			sampleCount++;
			if (accelerating) {
				acceleratingCount++;
			}
		}

		void clear() {
			while (oldest != null) {
				Shake removed = oldest;
				oldest = removed.next;
				shakePool.release(removed);
			}
			newest = null;
			sampleCount = 0;
			acceleratingCount = 0;
		}

		void purge(long cutoff) {
			while (sampleCount >= MIN_QUEUE_SIZE && oldest != null
					&& cutoff - oldest.timestamp > 0) {
				Shake removed = oldest;
				if (removed.accelerating) {
					acceleratingCount--;
				}
				sampleCount--;

				oldest = removed.next;
				if (oldest == null) {
					newest = null;
				}
				shakePool.release(removed);
			}
		}

		List<Shake> asList() {
			List<Shake> list = new ArrayList<Shake>();
			Shake s = oldest;
			while (s != null) {
				list.add(s);
				s = s.next;
			}
			return list;
		}

		boolean isShaking() {
			return newest != null
					&& oldest != null
					&& newest.timestamp - oldest.timestamp >= MIN_WINDOW_SIZE
					&& acceleratingCount >= (sampleCount >> 1)
							+ (sampleCount >> 2);
		}
	}

	static class Shake {
		long timestamp;
		boolean accelerating;
		Shake next;
	}

	static class ShakePool {
		private Shake head;

		Shake acquire() {
			Shake acquired = head;
			if (acquired == null) {
				acquired = new Shake();
			} else {
				head = acquired.next;
			}
			return acquired;
		}

		void release(Shake shake) {
			shake.next = head;
			head = shake;
		}
	}

	@Override
	public void onAccuracyChanged(Sensor sensor, int accuracy) {

	}
}
