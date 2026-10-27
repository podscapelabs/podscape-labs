import { saveProductRecord, toggleProductArchive } from "@/app/admin/products/actions";
import { ProductPhotoEditor } from "@/components/ProductPhotoEditor";
import { ProductVariantEditor } from "@/components/ProductVariantEditor";
import { productCategories, type ProductInventoryAdjustment, type ProductRecord, type ProductVariantRecord } from "@/data/products";
import styles from "./ProductEditor.module.css";

type SpeciesOption = { id: string; commonName: string; scientificName: string };

export function ProductEditor({ product, speciesOptions, variants, adjustments, normalized, saved, created, error }: { product: ProductRecord; speciesOptions: SpeciesOption[]; variants: ProductVariantRecord[]; adjustments: ProductInventoryAdjustment[]; normalized: boolean; saved: boolean; created: boolean; error?: string }) {
  return <section className={styles.workspace}>
    {saved ? <p className="admin-save-message is-success">Product saved. The catalogue and shop preview now use this version.</p> : null}
    {created ? <p className="admin-save-message is-success">Draft created. Add the product details below.</p> : null}
    {error ? <p className="admin-save-message is-error">{error}</p> : null}
    <form className={`admin-species-form ${styles.form}`} id="product-editor-form" action={saveProductRecord}>
      <input type="hidden" name="id" value={product.id} />
      <fieldset className={styles.basics}><legend><span aria-hidden="true">01</span> Basic information</legend>
        <div className="admin-form-grid two"><label><span>Product name</span><input name="title" defaultValue={product.title} required maxLength={180} /></label><label><span>Category</span><select name="category" defaultValue={product.category}>{productCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label></div>
        <label><span>Short description</span><textarea name="summary" defaultValue={product.summary} rows={3} maxLength={600} /></label>
        <label><span>Full description</span><textarea name="description" defaultValue={product.description} rows={8} maxLength={8000} /></label>
        <div className="admin-form-grid two"><label><span>URL slug</span><input name="slug" defaultValue={product.slug} /></label><label><span>Tags · comma separated</span><input name="tags" defaultValue={product.tags.join(", ")} /></label></div>
      </fieldset>
      <fieldset className={styles.images}><legend><span aria-hidden="true">02</span> Images</legend>
        <ProductPhotoEditor image={product.image} imagePositionX={product.imagePositionX} imagePositionY={product.imagePositionY} imageZoom={product.imageZoom} />
        {product.image ? <label className="admin-check-control"><input name="removePhoto" type="checkbox" value="yes" /><span>Remove this photograph when saving</span></label> : null}
        <label><span>Accessible image description</span><input name="imageAlt" defaultValue={product.imageAlt} maxLength={240} /></label>
      </fieldset>
      <fieldset className={styles.inventory}><legend><span aria-hidden="true">03</span> Pricing & inventory</legend>
        <ProductVariantEditor initialVariants={variants} />
        <div className="admin-form-grid two"><label><span>Availability</span><select name="availability" defaultValue={product.availability}><option value="coming-soon">Coming soon</option><option value="in-stock">In stock</option><option value="sold-out">Sold out</option></select></label><label><span>Stock adjustment reason</span><select name="inventoryAdjustmentReason" defaultValue="manual"><option value="manual">Manual count</option><option value="return">Return</option><option value="damage">Damaged or removed</option><option value="correction">Correction</option></select></label></div>
        <label><span>Stock adjustment note · optional</span><input name="inventoryAdjustmentNote" maxLength={1000} placeholder="For example: received a new shipment" /></label>
        {!normalized ? <p className="admin-inline-note">The normalized inventory history becomes available after the additive Shop Manager database migration is applied. Existing product information remains intact.</p> : null}
      </fieldset>
      <fieldset className={styles.details}><legend><span aria-hidden="true">04</span> Product details</legend>
        <div className="admin-form-grid three"><label><span>Product type</span><select name="productType" defaultValue={product.productType || "physical"}><option value="physical">Physical</option><option value="digital">Digital</option></select></label><label><span>Weight · grams</span><input name="weightGrams" type="number" min="0" step="0.01" defaultValue={product.weightGrams ?? ""} placeholder="Optional" /></label><label><span>Leaf Ledger link · optional</span><select name="speciesRecordId" defaultValue={product.speciesRecordId || ""}><option value="">No linked species</option>{speciesOptions.map((species) => <option value={species.id} key={species.id}>{species.commonName || "Unassigned"}{species.scientificName ? ` · ${species.scientificName}` : ""}</option>)}</select></label></div>
        <p className="admin-inline-note">Linking retrieves the species identity without copying or changing the Leaf Ledger record. Product pricing, stock and descriptions remain independent.</p>
        <label><span>Materials or contents</span><textarea name="materials" defaultValue={product.materials} rows={4} /></label><label><span>Shipping note</span><textarea name="shippingNote" defaultValue={product.shippingNote} rows={4} placeholder="Product-specific size, handling or dispatch note." /></label>
        <div className="admin-form-grid two"><label className="admin-check-control"><input name="requiresShipping" type="checkbox" value="yes" defaultChecked={product.requiresShipping ?? true} /><span>Requires shipping</span></label><label className="admin-check-control"><input name="allowBackorders" type="checkbox" value="yes" defaultChecked={product.allowBackorders ?? false} /><span>Allow backorders</span></label></div>
      </fieldset>
      <fieldset className={styles.visibility}><legend><span aria-hidden="true">05</span> Visibility & search</legend>
        <div className="admin-form-grid three"><label><span>Publication</span><select name="status" defaultValue={product.status}><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="admin-check-control"><input name="featured" type="checkbox" value="yes" defaultChecked={product.featured} /><span>Featured product</span></label></div>
        <div className="admin-form-grid two"><label><span>Search title</span><input name="seoTitle" defaultValue={product.seoTitle || ""} maxLength={180} placeholder={product.title} /></label><label><span>Search description</span><textarea name="seoDescription" defaultValue={product.seoDescription || ""} maxLength={320} rows={3} placeholder={product.summary} /></label></div>
      </fieldset>
      <div className={styles.saveBar}><p>Checkout remains disabled. Publishing controls catalogue visibility only.</p><button type="submit">Save product</button></div>
    </form>
    <section className={styles.history} aria-labelledby="inventory-history-title">
      <div><p className="admin-kicker">Audit trail</p><h2 id="inventory-history-title">Inventory history</h2><p>Stock changes are recorded when the product is saved.</p></div>
      {adjustments.length ? <ol>{adjustments.slice(0, 12).map((adjustment) => <li key={adjustment.id}><span className={adjustment.quantityDelta > 0 ? styles.increase : styles.decrease}>{adjustment.quantityDelta > 0 ? "+" : ""}{adjustment.quantityDelta}</span><span><strong>{adjustment.variantTitle}</strong><small>{adjustment.reason.replaceAll("-", " ")}{adjustment.note ? ` · ${adjustment.note}` : ""}</small></span><span className={styles.historyAfter}>{adjustment.quantityAfter} after</span><time dateTime={adjustment.createdAt}>{new Date(adjustment.createdAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</time></li>)}</ol> : <p className={styles.historyEmpty}>{normalized ? "No stock changes recorded yet." : "Inventory history will appear here after the database migration is applied."}</p>}
    </section>
    <form className={styles.archive} action={toggleProductArchive}><input type="hidden" name="id" value={product.id} /><div><strong>{product.archivedAt ? "Restore this product" : "Archive this product"}</strong><p>{product.archivedAt ? "Return it to the active catalogue." : "Hide it without deleting its data or inventory."}</p></div><button type="submit">{product.archivedAt ? "Restore" : "Archive"}</button></form>
  </section>;
}
