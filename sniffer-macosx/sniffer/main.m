#import "Recorder.h"

int main(int argc, const char * argv[])
{
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    [[[[Recorder alloc] init] autorelease] run];

    [pool release];
    return 0;
}

