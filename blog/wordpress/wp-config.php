<?php
    /**
     * The base configurations of the WordPress.
     *
     * This file has the following configurations: MySQL settings, Table Prefix,
     * Secret Keys, WordPress Language, and ABSPATH. You can find more information
     * by visiting {@link http://codex.wordpress.org/Editing_wp-config.php Editing
     * wp-config.php} Codex page. You can get the MySQL settings from your web host.
     *
     * This file is used by the wp-config.php creation script during the
     * installation. You don't have to use the web site, you can just copy this file
     * to "wp-config.php" and fill in the values.
     *
     * @package WordPress
     */

    // Required for batcache use
    define('WP_CACHE', true);

    // ** MySQL settings - You can get this info from your web host ** //
    /** The name of the database for WordPress */
    define('DB_NAME', 'wordpress_db');

    if (isset($_SERVER['SERVER_SOFTWARE']) && strpos($_SERVER['SERVER_SOFTWARE'],'Google App Engine') !== false) {
        /** Live environment Cloud SQL login and SITE_URL info */
        /** Note that from App Engine, the password is not required, so leave it blank here */
        define('DB_HOST', ':/cloudsql/blog-usersource:wordpress');
        define('DB_USER', 'root');
        define('DB_PASSWORD', '');
    } else {
        /** Local environment MySQL login info */
        define('DB_HOST', '127.0.0.1');
        define('DB_USER', 'root');
        define('DB_PASSWORD', 'root');
    }

    // Determine HTTP or HTTPS, then set WP_SITEURL and WP_HOME
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443)
    {
        $protocol_to_use = 'https://';
    } else {
        $protocol_to_use = 'http://';
    }
    define( 'WP_SITEURL', $protocol_to_use . $_SERVER['HTTP_HOST']);
    define( 'WP_HOME', $protocol_to_use . $_SERVER['HTTP_HOST']);

    /** Database Charset to use in creating database tables. */
    define('DB_CHARSET', 'utf8');

    /** The Database Collate type. Don't change this if in doubt. */
    define('DB_COLLATE', '');

    /**#@+
     * Authentication Unique Keys and Salts.
     *
     * Change these to different unique phrases!
     * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
     * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
     *
     * @since 2.6.0
     */
    define('AUTH_KEY',         'gx;3`|V.Yv [#C=;/Aot+0h8mw-0@NQRDl:#f.X{a:gu*X}CN}M+x~[~9dHz|</|');
    define('SECURE_AUTH_KEY',  '-wU0QZ>$zYiWA0--1Sj6Y<%^V)2H?U]{JVOO7Sk|(*$9~9kA,!Vsaw}dssNQ2g%}');
    define('LOGGED_IN_KEY',    'hVMiu+5jb7@Xuf*MA3z7Z+ fBc:eoYp1@3P+1QLphl{X3lU~|a >}R4KYGJh 51R');
    define('NONCE_KEY',        'lVY-/$_ Bi^ql^!&?kVYWBEu$*rF<]WrzYBs!FAZu7)q^Lj,F}<KunzRTTp.j+JT');
    define('AUTH_SALT',        'o8We}*P^|ZWTA9XoM.)s` Ez]V&_XFIU)G1og.P7gMl+/5@rNKFgUj/P2]m9B?M4');
    define('SECURE_AUTH_SALT', 'YheP+{n&dy-r$1hl9?FaKwkz`%y6/&H-fs}kj(o9]8h-mj$68`zHUT+}0*RR@0_^');
    define('LOGGED_IN_SALT',   'Wk/h@^aKK3%fnL|OV(n;IAd~8fCY9e3%?JZ.FYr)|%]xgR}?-=&6DFh,Uwe{QueQ');
    define('NONCE_SALT',       'a_f5gK)ar~W/u]-0|;Hgm4Bm#wGe8YI>[Bx7Xred#wf7J:#{^U4-?r$I,ry}Uc`2');

    /**#@-*/

    /**
     * WordPress Database Table prefix.
     *
     * You can have multiple installations in one database if you give each a unique
     * prefix. Only numbers, letters, and underscores please!
     */
    $table_prefix  = 'wp_';

    /**
     * WordPress Localized Language, defaults to English.
     *
     * Change this to localize WordPress. A corresponding MO file for the chosen
     * language must be installed to wp-content/languages. For example, install
     * de_DE.mo to wp-content/languages and set WPLANG to 'de_DE' to enable German
     * language support.
     */
    define('WPLANG', '');

    /**
     * For developers: WordPress debugging mode.
     *
     * Change this to true to enable the display of notices during development.
     * It is strongly recommended that plugin and theme developers use WP_DEBUG
     * in their development environments.
     */
    define('WP_DEBUG', false);
    
    /**
     * Disable default wp-cron in favor of a real cron job
     */
    define('DISABLE_WP_CRON', true);
    
    // configures batcache
    $batcache = [
      'seconds'=>0,
      'max_age'=>30*60, // 30 minutes
      'debug'=>false
    ];
    /* That's all, stop editing! Happy blogging. */

    /** Absolute path to the WordPress directory. */
    if ( !defined('ABSPATH') )
        define('ABSPATH', dirname(__FILE__) . '/wordpress/');

    /** Sets up WordPress vars and included files. */
    require_once(ABSPATH . 'wp-settings.php');


