# No obfuscation needed - the app has a single Activity and no reflection beyond the
# JavaScript bridge. Keep the bridge method name intact.
-keepclassmembers class com.arrowpuzzle.advanced.MainActivity$Bridge {
    public *;
}
