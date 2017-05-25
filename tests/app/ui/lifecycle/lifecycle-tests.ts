import * as helper from "../helper";
import * as btnCounter from "./pages/button-counter";
import * as TKUnit from "../../TKUnit";
import { isIOS } from "tns-core-modules/platform";

// Integration tests that asser sertain runtime behavior, lifecycle events atc.

export function test_builder_sets_native_properties_once() {
    const page = helper.navigateToModule("ui/lifecycle/pages/page-one");
    const buttons = ["btn1", "btn2", "btn3", "btn4"].map(id => page.getViewById<btnCounter.Button>(id));
    buttons.forEach(btn => {
        TKUnit.assertEqual(btn.backgroundInternalSetNativeCount, 1, `Expected ${btn.id}'s backgroundInternal.setNative to be exactly once when inflating from xml.`);
        TKUnit.assertEqual(btn.fontInternalSetNativeCount, 1, `Expected ${btn.id}'s fontInternal.setNative to be called exactly once when inflating from xml.`);
        TKUnit.assertEqual(btn.nativeBackgroundRedraws, 1, `Expected ${btn.id}'s native background to propagated exactly once when inflating from xml.`);
    });
}

export function test_setting_properties_does_not_makes_excessive_calls() {
    const page = helper.navigateToModule("ui/lifecycle/pages/page-one");
    const btn1 = page.getViewById<btnCounter.Button>("btn1");

    function assert(count) {
        TKUnit.assertEqual(btn1.backgroundInternalSetNativeCount, count, "backgroundInternal.setNative");
        TKUnit.assertEqual(btn1.nativeBackgroundRedraws, count, "_redrawNativeBackground");
    }

    assert(1);

    btn1.width = 50;
    btn1.height = 50;
    btn1.style.borderWidth = "18";
    helper.waitUntilLayoutReady(btn1);

    assert(2);

    btn1.width = 80;
    btn1.height = 80;
    btn1.style.borderWidth = "22";
    helper.waitUntilLayoutReady(btn1);

    assert(3);

    btn1.style.borderWidth = "26";
    helper.waitUntilLayoutReady(btn1);

    assert(4);
}

export function test_setting_one_property_while_suspedned_does_not_call_other_properties_native_setter() {
    const page = helper.navigateToModule("ui/lifecycle/pages/page-one");
    const btn1 = page.getViewById<btnCounter.Button>("btn1");

    TKUnit.assertEqual(btn1.backgroundInternalSetNativeCount, 1, "backgroundInternal.setNative at step1");
    TKUnit.assertEqual(btn1.fontInternalSetNativeCount, 1, "fontInternal.setNative at step1");

    btn1._batchUpdate(() => {
        // None
    });

    TKUnit.assertEqual(btn1.backgroundInternalSetNativeCount, 1, "backgroundInternal.setNative at step2");
    TKUnit.assertEqual(btn1.fontInternalSetNativeCount, 1, "fontInternal.setNative at step2");

    btn1._batchUpdate(() => {
        btn1.style.borderWidth = "22";
    });

    TKUnit.assertEqual(btn1.backgroundInternalSetNativeCount, 2, "backgroundInternal.setNative at step3");
    TKUnit.assertEqual(btn1.fontInternalSetNativeCount, 1, "fontInternal.setNative at step3");

    btn1._batchUpdate(() => {
        btn1.style.fontSize = 69;
    });

    TKUnit.assertEqual(btn1.backgroundInternalSetNativeCount, 2, "backgroundInternal.setNative at step4");
    TKUnit.assertEqual(btn1.fontInternalSetNativeCount, 2, "fontInternal.setNative at step4");
}

export function test_css_properties_reset_only_once() {
    const page = helper.navigateToModule("ui/lifecycle/pages/page-one");
    const btn2 = page.getViewById<btnCounter.Button>("btn2");

    TKUnit.assertEqual(btn2.backgroundInternalSetNativeCount, 1, `Expected ${btn2.id}'s backgroundInternal.setNative to be exactly once when inflating from xml.`);
    TKUnit.assertEqual(btn2.fontInternalSetNativeCount, 1, `Expected ${btn2.id}'s fontInternal.setNative to be called exactly once when inflating from xml.`);
    TKUnit.assertEqual(btn2.nativeBackgroundRedraws, 1, `Expected ${btn2.id}'s native background to propagated exactly once when inflating from xml.`);

    page.css = "";

    TKUnit.assertEqual(btn2.backgroundInternalSetNativeCount, 2, `Expected ${btn2.id}'s backgroundInternal.setNative to be exactly once when inflating from xml.`);
    TKUnit.assertEqual(btn2.fontInternalSetNativeCount, 2, `Expected ${btn2.id}'s fontInternal.setNative to be called exactly once when inflating from xml.`);
    TKUnit.assertEqual(btn2.nativeBackgroundRedraws, isIOS ? 1 : 2, `Expected ${btn2.id}'s native background to propagated exactly once when inflating from xml.`);

    helper.waitUntilLayoutReady(btn2);

    TKUnit.assertEqual(btn2.backgroundInternalSetNativeCount, 2, `Expected ${btn2.id}'s backgroundInternal.setNative to be exactly once when inflating from xml.`);
    TKUnit.assertEqual(btn2.fontInternalSetNativeCount, 2, `Expected ${btn2.id}'s fontInternal.setNative to be called exactly once when inflating from xml.`);
    TKUnit.assertEqual(btn2.nativeBackgroundRedraws, 2, `Expected ${btn2.id}'s native background to propagated exactly once when inflating from xml.`);
}

export function test_navigating_away_does_not_excessively_reset() {
    const page = helper.navigateToModule("ui/lifecycle/pages/page-one");
    const buttons = ["btn1", "btn2", "btn3", "btn4"].map(id => page.getViewById<btnCounter.Button>(id));
    function assert(count) {
        buttons.forEach(button => {
            TKUnit.assertEqual(button.backgroundInternalSetNativeCount, count, `Expecting ${button.id}'s backgroundInternal.setNative call count`);
            TKUnit.assertEqual(button.fontInternalSetNativeCount, count, `Expecting ${button.id}'s fontInternal.setNative call count`);
            TKUnit.assertEqual(button.nativeBackgroundRedraws, count, `Expecting ${button.id}'s nativeBackgroundRedraws call count`);
        })
    }

    assert(1);

    const page2 = helper.navigateToModule("ui/lifecycle/pages/page-one");

    helper.waitUntilLayoutReady(page2);

    // NOTE: Recycling may mess this up so feel free to change the test,
    // but ensure a reasonable amount of native setters were called when the views navigate away
    assert(1);
}