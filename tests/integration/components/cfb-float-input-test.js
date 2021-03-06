import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";
import { render } from "@ember/test-helpers";
import { hbs } from "ember-cli-htmlbars";

module("Integration | Component | cfb-float-input", function (hooks) {
  setupRenderingTest(hooks);

  test("it renders", async function (assert) {
    assert.expect(1);

    await render(
      hbs`{{cfb-float-input name="test" update=(action (mut value))}}`
    );

    assert.dom("input[name=test]").exists();
  });
});
