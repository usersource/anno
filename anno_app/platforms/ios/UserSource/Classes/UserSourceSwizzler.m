#import "UserSourceSwizzler.h"
#import <objc/runtime.h>

void SwizzleMethod(Class c, SEL old, SEL new) {
    Method oldMethod = class_getInstanceMethod(c, old);
    Method newMethod = class_getInstanceMethod(c, new);

    if(class_addMethod(c, old, method_getImplementation(newMethod), method_getTypeEncoding(newMethod))) {
        class_replaceMethod(c, new, method_getImplementation(oldMethod), method_getTypeEncoding(oldMethod));
    } else {
        method_exchangeImplementations(oldMethod, newMethod);
    }
}