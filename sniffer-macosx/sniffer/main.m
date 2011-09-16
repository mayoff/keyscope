#import "Recorder.h"

static void enableUniversalAccess()
{
    NSAppleScript *script = [[NSAppleScript alloc] initWithSource:@"tell app \"System Events\"\nset UI elements enabled to true\nget UI elements enabled\nend"];
    NSDictionary *error;
    NSAppleEventDescriptor *aed = [script executeAndReturnError:&error];
    [script release];
    if (!aed) {
        NSLog(@"keyscope/sniffer: error enabling universal access: %@", error);
        exit(1);
    }
    if ([aed descriptorType] != 'true') {
        NSLog(@"keyscope/sniffer: failed to enable universal access");
        exit(1);
    }
}

int main(int argc, const char * argv[])
{
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    
    // Try to ensure that access for assistive devices is enabled in the Universal Access system preference pane.  Event taps can't listen to keydown and keyup events without it.
    enableUniversalAccess();

    [[[[Recorder alloc] init] autorelease] run];

    [pool release];
    return 0;
}

