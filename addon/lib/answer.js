import Base from "ember-caluma/lib/base";
import { computed } from "@ember/object";
import { camelize } from "@ember/string";
import { assert } from "@ember/debug";
import { inject as service } from "@ember/service";
import { decodeId } from "ember-caluma/helpers/decode-id";
import { getOwner } from "@ember/application";
import { parseDocument } from "ember-caluma/lib/parsers";
import { isEmpty } from "@ember/utils";

/**
 * Object which represents an answer in context of a field
 *
 * @class Answer
 */
export default Base.extend({
  calumaStore: service(),

  init() {
    assert(
      "A graphql answer `raw` must be passed",
      this.raw && /Answer$/.test(this.raw.__typename)
    );

    if (this.raw.id) {
      this.set("pk", `Answer:${decodeId(this.raw.id)}`);
    }

    this._super(...arguments);

    this.setProperties(this.raw);
  },

  /**
   * The uuid of the answer
   *
   * @property {String} uuid
   * @accessor
   */
  uuid: computed("raw.id", function () {
    return this.raw.id ? decodeId(this.raw.id) : null;
  }),

  isNew: computed("uuid", "value", function () {
    return !this.uuid || isEmpty(this.value);
  }),

  /**
   * The name of the property in which the value is stored. This depends on the
   * type of the answer.
   *
   *
   * @property {String} _valueKey
   * @accessor
   * @private
   */
  _valueKey: computed("__typename", function () {
    return (
      this.__typename &&
      `${camelize(this.__typename.replace(/Answer$/, ""))}Value`
    );
  }),

  /**
   * The value of the answer, the type of this value depends on the type of the
   * answer. For table answers this returns an array of documents.
   *
   * @property {String|Number|String[]|Document[]} value
   * @computed
   */
  value: computed(
    "_valueKey",
    "stringValue",
    "integerValue",
    "floatValue",
    "listValue",
    "fileValue",
    "dateValue",
    "tableValue",
    {
      get() {
        const value = this.get(this._valueKey);

        if (this.__typename === "TableAnswer" && value) {
          return value.map((document) => {
            const existing = this.calumaStore.find(
              `Document:${decodeId(document.id)}`
            );

            return (
              existing ||
              getOwner(this)
                .factoryFor("caluma-model:document")
                .create({
                  raw: parseDocument(document),
                  parentDocument: this.field.document,
                })
            );
          });
        }

        return value;
      },
      set(_, value) {
        value = [undefined, ""].includes(value) ? null : value;

        if (this._valueKey) {
          this.set(this._valueKey, value);
        }

        return value;
      },
    }
  ),

  /**
   * The value serialized for a backend request.
   *
   * @property {String|Number|String[]} serializedValue
   * @accessor
   */
  serializedValue: computed("value", function () {
    if (this.__typename === "TableAnswer") {
      return (this.value || []).map(({ uuid }) => uuid);
    }

    return this.value;
  }),
});
