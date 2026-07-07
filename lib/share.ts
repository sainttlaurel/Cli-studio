// Instagram Stories sharing from mobile web.
//
// Unlike TikTok, Instagram has a real (if unofficial-for-web) mechanism:
// write the image to the system clipboard, then navigate to
// `instagram-stories://share`. Meta's own docs describe this via
// UIPasteboard with custom pasteboard types for *native* apps — there's
// no public spec for plain websites. In practice, writing a standard
// image/png ClipboardItem via the Web Clipboard API and then triggering
// the URL scheme works on iOS Safari, because Instagram's Stories
// composer also checks the general system clipboard when its own custom
// pasteboard keys aren't present. This is a widely used but *unofficial*
// technique — treat it as best-effort, not a guaranteed integration that
// will keep working across every future iOS/Instagram version.
//
// Deliberately iOS-only: Android's equivalent needs a content:// URI
// passed through an Android Intent, which isn't reachable from a web
// page without a native wrapper, and desktop has no Instagram app to
// hand off to.

const IOS_UA_PATTERN = /iPad|iPhone|iPod/;

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return IOS_UA_PATTERN.test(navigator.userAgent);
}

export function canShareToInstagramStories(): boolean {
  return (
    isIOS() &&
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    typeof ClipboardItem !== 'undefined' &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  );
}

/**
 * Attempts to hand the given PNG blob to Instagram's Stories composer.
 * Must be called synchronously from within a user gesture (directly in a
 * click handler) — Safari gates clipboard-write permission on that, and
 * awaiting other work first can silently break it.
 *
 * Resolves true if Instagram appears to have opened (best-effort
 * detection via page visibility within ~1.5s), false otherwise — the
 * caller should fall back to the regular share sheet when false.
 */
export async function shareToInstagramStories(blob: Blob): Promise<boolean> {
  if (!canShareToInstagramStories()) return false;

  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Could not copy image for Instagram Stories:', err);
    return false;
  }

  return new Promise((resolve) => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        cleanup();
        resolve(true);
      }
    };

    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimeout(timer);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    // If Instagram hasn't taken the page away within ~1.5s, it's not
    // installed (or the scheme silently failed) — this only runs if
    // onVisibilityChange never fired, since that handler clears it.
    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 1500);

    // NOTE: swap in a real Facebook App ID here if you have one
    // registered. Meta's docs ask for it via source_application for
    // attribution; the scheme has been observed to still open the
    // composer with a placeholder value, but this isn't guaranteed.
    window.location.href = 'instagram-stories://share?source_application=clickstudio';
  });
}