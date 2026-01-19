/**
 * Google News RSS URL Decoder
 * Decodes Google News redirected URLs (news.google.com/rss/articles/...) to original URLs.
 */

export function decodeGoogleNewsUrl(encodedUrl: string): string {
    try {
        // 确保URL有协议前缀
        let urlToParse = encodedUrl;
        if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
            urlToParse = 'https://' + urlToParse;
        }
        const url = new URL(urlToParse);

        // Only process Google News URLs
        if (url.hostname !== 'news.google.com') {
            return encodedUrl;
        }

        // Extract the encoded part from the pathname
        // Format: /rss/articles/ENCODED_PART or /articles/ENCODED_PART
        const pathMatch = url.pathname.match(/\/(?:rss\/)?articles\/([^/?]+)/);
        if (!pathMatch) {
            console.warn('[Decoder] No article ID found in path:', url.pathname);
            return encodedUrl;
        }

        const encodedPart = pathMatch[1];
        console.log('[Decoder] Encoded part:', encodedPart);

        try {
            // Google News uses a modified Base64 encoding
            // The encoded part starts with 'CBM' or similar prefix
            // Replace URL-safe characters back to standard Base64
            let base64 = encodedPart.replace(/-/g, '+').replace(/_/g, '/');

            // Add padding if needed
            while (base64.length % 4 !== 0) {
                base64 += '=';
            }

            console.log('[Decoder] Base64 string:', base64);

            // Decode the Base64 string
            const decoded = atob(base64);
            console.log('[Decoder] Decoded bytes length:', decoded.length);

            // The decoded string contains binary data with the URL embedded
            // Look for http:// or https:// patterns
            const urlPattern = /(https?:\/\/[^\s\x00-\x1F\x7F\x22\x27<>]+)/g;
            const matches = decoded.match(urlPattern);

            if (matches && matches.length > 0) {
                // Usually the first or last match is the actual article URL
                // Try the longest match as it's likely the full URL
                const longestMatch = matches.reduce((a, b) => a.length > b.length ? a : b);

                // Clean up the URL
                let cleanUrl = longestMatch.replace(/[\x00-\x1F\x7F]+/g, '');

                // Validate that we got a proper URL
                try {
                    // 确保URL有协议前缀
                    let cleanUrlToParse = cleanUrl;
                    if (!cleanUrlToParse.startsWith('http://') && !cleanUrlToParse.startsWith('https://')) {
                        cleanUrlToParse = 'https://' + cleanUrlToParse;
                    }
                    const testUrl = new URL(cleanUrlToParse);
                    // Make sure it's not a Google URL
                    if (!testUrl.hostname.includes('google.com')) {
                        console.log('[Decoder] Successfully decoded:', encodedUrl, '->', cleanUrl);
                        return cleanUrl;
                    }
                } catch {
                    // Invalid URL, continue to next match
                }

                // Try other matches if the longest one was a Google URL
                for (const match of matches) {
                    const testClean = match.replace(/[\x00-\x1F\x7F]+/g, '');
                    try {
                        // 确保URL有协议前缀
                        let testCleanToParse = testClean;
                        if (!testCleanToParse.startsWith('http://') && !testCleanToParse.startsWith('https://')) {
                            testCleanToParse = 'https://' + testCleanToParse;
                        }
                        const testUrl = new URL(testCleanToParse);
                        if (!testUrl.hostname.includes('google.com')) {
                            console.log('[Decoder] Successfully decoded (alt):', encodedUrl, '->', testClean);
                            return testClean;
                        }
                    } catch {
                        continue;
                    }
                }
            }

            console.warn('[Decoder] No valid URL found in decoded content');
        } catch (decodeError) {
            console.error('[Decoder] Base64 decode failed:', decodeError);
        }

        // If decoding failed, return the original URL
        console.warn('[Decoder] Decoding failed, returning original URL');
        return encodedUrl;
    } catch (e) {
        console.error('[Decoder] Failed to decode Google News URL:', e);
        return encodedUrl;
    }
}
