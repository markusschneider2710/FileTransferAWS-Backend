export async function handler(event: any, context: any) {
    const allowedDomain = "@fielmann.com"
    const userEmail = event.request.userAttributes.email;
    
    if (!userEmail.endsWith(allowedDomain)) {
        throw new Error ("Diese E-Mail ist nicht erlaubt");
    }
    return event;
}