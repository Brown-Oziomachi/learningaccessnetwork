export function middleware(request) {
    if (request.nextUrl.pathname.startsWith('/books')) {
        console.log("MATCHED BOOK PATH:", request.nextUrl.href);
    }
}