"use client";
import { useState } from "react";
import { deleteProductRecord, saveProductRecord, toggleProductArchive } from "@/app/admin/products/actions";
import { ProductPhotoEditor } from "@/components/ProductPhotoEditor";
import { ProductVariantEditor } from "@/components/ProductVariantEditor";
import { productCategories, type ProductInventoryAdjustment, type ProductRecord, type ProductVariantRecord } from "@/data/products";
import { productSlug, productSuggestedTags } from "@/lib/product-identifiers";
import styles from "./ProductEditor.module.css";

type SpeciesOption = { id: string; commonName: string; scientificName: string; genus: string; species: string; morph: string; summary: string };

export function ProductEditor({ product, speciesOptions, variants, adjustments, normalized, saved, created, error }: { product: ProductRecord; speciesOptions: SpeciesOption[]; variants: ProductVariantRecord[]; adjustments: ProductInventoryAdjustment[]; normalized: boolean; saved: boolean; created: boolean; error?: string }) {
  const [linkedSpeciesId, setLinkedSpeciesId] = useState(product.speciesRecordId || "");
  const [title, setTitle] = useState(product.title);
  const [summary, setSummary] = useState(product.summary);
  const [category, setCategory] = useState(product.category);
  const [slug, setSlug] = useState(product.slug);
  const [slugEdited, setSlugEdited] = useState(false);
  const [tags, setTags] = useState(product.tags.join(", "));
  const [tagsEdited, setTagsEdited] = useState(false);
  const newDraft = product.slug === `draft-${product.id.slice(-8)}`;
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleting || deleteText !== "DELETE") return;
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteProductRecord(new FormData(event.currentTarget));
      if (!result.ok) {
        setDeleteError(result.error || "Product could not be deleted.");
        setDeleting(false);
        return;
      }
      // Full navigation avoids refreshing the product detail route after it was removed.
      window.location.assign("/admin/products?deleted=1");
    } catch {
      setDeleteError("The delete request could not be completed. Return to Shop Manager to check whether the product is still listed.");
      setDeleting(false);
    }
  }
  const selectedSpecies = speciesOptions.find((species) => species.id === linkedSpeciesId);
  const suggestedTags = productSuggestedTags(category, title, selectedSpecies);
  const displayedTags = tagsEdited || tags.trim() ? tags : suggestedTags.join(", ");
  const displayedSlug = slugEdited || !newDraft ? slug : productSlug(title === "Untitled product" ? "" : title);
  function resetSlug() { setSlug(productSlug(title)); setSlugEdited(true); }
  function selectSpecies(id: string) {
    setLinkedSpeciesId(id);
  }
  function autofillFromLedger() {
    if (!selectedSpecies) return;
    setTitle(selectedSpecies.commonName || selectedSpecies.scientificName || title);
    if (!summary.trim() && selectedSpecies.summary) setSummary(selectedSpecies.summary.slice(0, 600));
  }
  return <section className={styles.workspace}>
    {saved ? <p className="admin-save-message is-success">Product saved. The catalogue and shop preview now use this version.</p> : null}
    {created ? <p className="admin-save-message is-success">Draft created. Add the product details below.</p> : null}
    {error ? <p className="admin-save-message is-error">{error}</p> : null}
    <form className={`admin-species-form ${styles.form}`} id="product-editor-form" action={saveProductRecord}>
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="tagsMode" value={tagsEdited ? "manual" : "suggested"} />
      <input type="hidden" name="slugMode" value={newDraft && !slugEdited ? "auto" : "manual"} />
      <nav className={styles.sectionNav} aria-label="Jump to product sections">
        <a href="#product-ledger">01 Species</a>
        <a href="#product-basics">02 Listing</a>
        <a href="#product-stock">03 Inventory</a>
        <a href="#product-photos">04 Photos</a>
        <a href="#product-shipping">05 Shipping</a>
        <a href="#product-publishing">06 Publish</a>
      </nav>
      <fieldset id="product-ledger" className={styles.ledgerFirst}><legend><span aria-hidden="true">01</span> Start from Leaf Ledger</legend>
        <p className={styles.ledgerIntro}>Selling isopods? Choose a species first. Its scientific name and morph will be saved with this product.</p>
        <label><span>Species / morph</span><select name="speciesRecordId" value={linkedSpeciesId} onChange={(event) => selectSpecies(event.target.value)}><option value="">No species — other merchandise</option>{speciesOptions.map((species) => <option key={species.id} value={species.id}>{species.commonName || species.scientificName || "Unassigned"}{species.scientificName ? ` · ${species.scientificName}` : ""}{species.morph && species.morph !== species.commonName ? ` · ${species.morph}` : ""}</option>)}</select></label>
        {selectedSpecies ? <div className={styles.ledgerPreview} aria-live="polite"><div><span>Scientific name</span><strong><i>{selectedSpecies.scientificName || "Not assigned"}</i></strong></div><div><span>Morph / locale</span><strong>{selectedSpecies.morph || "Not specified"}</strong></div><div><span>Genus / species</span><strong>{selectedSpecies.genus || "—"} / {selectedSpecies.species || "—"}</strong></div></div> : null}
        <button type="button" className={styles.autofill} disabled={!selectedSpecies} onClick={autofillFromLedger}>Autofill product name{!summary.trim() ? " & short description" : ""}</button>
        <p className={styles.ledgerHelp}>Autofill only replaces the product name; it adds the Ledger summary only when the description is empty. Scientific identity is synced securely from the Ledger when you save. Prices and inventory remain separate.</p>
      </fieldset>
      <fieldset id="product-basics" className={styles.basics}><legend><span aria-hidden="true">02</span> Basic information</legend>
        <div className="admin-form-grid two"><label><span>Product name</span><input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={180} /></label><label><span>Category</span><select name="category" value={category} onChange={(event) => setCategory(event.target.value)}>{productCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label></div>
        <label><span>Short description</span><textarea name="summary" value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} maxLength={600} /></label>
        <label><span>Full description</span><textarea name="description" defaultValue={product.description} rows={4} maxLength={8000} placeholder="Describe what is included, the species or product, and what buyers should know." /></label>
        <details className={styles.advanced}>
          <summary>Advanced listing options <span>URL & tags</span></summary>
        <div className="admin-form-grid two"><label><span>URL slug</span><input name="slug" value={displayedSlug} onChange={(event) => { setSlug(event.target.value); setSlugEdited(true); }} placeholder="Generated from product name" /><small className={styles.identifierHelp}>{newDraft && !slugEdited ? "Auto-generated from the name when saved." : "Saved URLs remain stable when you rename a product."}</small><button type="button" className={styles.identifierButton} onClick={resetSlug}>Use product name</button></label><label><span>Tags · comma separated</span><input name="tags" value={displayedTags} onChange={(event) => { setTags(event.target.value); setTagsEdited(true); }} /><small className={styles.identifierHelp}>Suggested from category and Leaf Ledger. Add or remove any tags.</small><button type="button" className={styles.identifierButton} onClick={() => { setTags(suggestedTags.join(", ")); setTagsEdited(true); }}>Refresh suggestions</button></label></div>
        </details>
      </fieldset>
      <fieldset id="product-stock" className={styles.inventory}><legend><span aria-hidden="true">03</span> Pricing & inventory</legend><p className={styles.sectionHint}>Set your pack sizes, prices and stock. You can add more variants whenever you need them.</p>
        <ProductVariantEditor initialVariants={variants} productId={product.id} category={category} speciesName={selectedSpecies?.commonName || selectedSpecies?.morph || title} />
        <div className="admin-form-grid two"><label><span>Availability</span><select name="availability" defaultValue={product.availability}><option value="coming-soon">Coming soon</option><option value="in-stock">In stock</option><option value="sold-out">Sold out</option></select></label><label><span>Stock adjustment reason</span><select name="inventoryAdjustmentReason" defaultValue="manual"><option value="manual">Manual count</option><option value="return">Return</option><option value="damage">Damaged or removed</option><option value="correction">Correction</option></select></label></div>
        <label><span>Stock adjustment note · optional</span><input name="inventoryAdjustmentNote" maxLength={1000} placeholder="For example: received a new shipment" /></label>
        {!normalized ? <p className="admin-inline-note">The normalized inventory history becomes available after the additive Shop Manager database migration is applied. Existing product information remains intact.</p> : null}
      </fieldset>
      <details id="product-photos" className={styles.collapsible} open={Boolean(product.image)}>
        <summary><span className={styles.stepNumber}>04</span><span>Product photos <small>Upload and adjust images</small></span><span className={styles.chevron}>⌄</span></summary>
        <fieldset className={styles.images} aria-label="Product photos">
        <ProductPhotoEditor image={product.image} imagePositionX={product.imagePositionX} imagePositionY={product.imagePositionY} imageZoom={product.imageZoom} />
        {product.image ? <label className="admin-check-control"><input name="removePhoto" type="checkbox" value="yes" /><span>Remove this photograph when saving</span></label> : null}
        <label><span>Accessible image description</span><input name="imageAlt" defaultValue={product.imageAlt} maxLength={240} /></label>
        </fieldset>
      </details>
      <fieldset id="product-shipping" className={styles.details}><legend><span aria-hidden="true">05</span> Shipping & product details</legend>
        <div className="admin-form-grid three"><label><span>Product type</span><select name="productType" defaultValue={product.productType || "physical"}><option value="physical">Physical</option><option value="digital">Digital</option></select></label><label><span>Weight · grams</span><input name="weightGrams" type="number" min="0" step="0.01" defaultValue={product.weightGrams ?? ""} placeholder="Optional" /></label></div>
        <details className={styles.advanced}>
          <summary>Additional product & shipping notes <span>Optional</span></summary>
        <label><span>Materials or contents</span><textarea name="materials" defaultValue={product.materials} rows={4} /></label><label><span>Shipping note</span><textarea name="shippingNote" defaultValue={product.shippingNote} rows={4} placeholder="Product-specific size, handling or dispatch note." /></label>
        </details>
        <div className="admin-form-grid two"><label className="admin-check-control"><input name="requiresShipping" type="checkbox" value="yes" defaultChecked={product.requiresShipping ?? true} /><span>Requires shipping</span></label><label className="admin-check-control"><input name="allowBackorders" type="checkbox" value="yes" defaultChecked={product.allowBackorders ?? false} /><span>Allow backorders</span></label></div>
      </fieldset>
      <fieldset id="product-publishing" className={styles.visibility}><legend><span aria-hidden="true">06</span> Visibility & search</legend>
        <div className="admin-form-grid three"><label><span>Publication</span><select name="status" defaultValue={product.status}><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="admin-check-control"><input name="featured" type="checkbox" value="yes" defaultChecked={product.featured} /><span>Featured product</span></label></div>
        <details className={styles.advanced}>
          <summary>Search engine preview & metadata <span>Optional</span></summary>
        <div className="admin-form-grid two"><label><span>Search title</span><input name="seoTitle" defaultValue={product.seoTitle || ""} maxLength={180} placeholder={product.title} /></label><label><span>Search description</span><textarea name="seoDescription" defaultValue={product.seoDescription || ""} maxLength={320} rows={3} placeholder={product.summary} /></label></div>
        </details>
      </fieldset>
      <div className={styles.saveBar}><p>Save your draft anytime. Publishing makes a listing visible, but checkout is still disabled.</p><button type="submit">Save product</button></div>
    </form>
    <section className={styles.history} aria-labelledby="inventory-history-title">
      <div><p className="admin-kicker">Audit trail</p><h2 id="inventory-history-title">Inventory history</h2><p>Stock changes are recorded when the product is saved.</p></div>
      {adjustments.length ? <ol>{adjustments.slice(0, 12).map((adjustment) => <li key={adjustment.id}><span className={adjustment.quantityDelta > 0 ? styles.increase : styles.decrease}>{adjustment.quantityDelta > 0 ? "+" : ""}{adjustment.quantityDelta}</span><span><strong>{adjustment.variantTitle}</strong><small>{adjustment.reason.replaceAll("-", " ")}{adjustment.note ? ` · ${adjustment.note}` : ""}</small></span><span className={styles.historyAfter}>{adjustment.quantityAfter} after</span><time dateTime={adjustment.createdAt}>{new Date(adjustment.createdAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</time></li>)}</ol> : <p className={styles.historyEmpty}>{normalized ? "No stock changes recorded yet." : "Inventory history will appear here after the database migration is applied."}</p>}
    </section>

    <section className={styles.productActions} aria-label="Product management actions">
      <form className={styles.archive} action={toggleProductArchive}>
        <input type="hidden" name="id" value={product.id} />
        <div><strong>{product.archivedAt ? "Restore this product" : "Archive this product"}</strong><p>{product.archivedAt ? "Return it to the active catalogue." : "Hide it without deleting its data or inventory."}</p></div>
        <button type="submit">{product.archivedAt ? "Restore" : "Archive"}</button>
      </form>
      <div className={styles.deletePanel}>
        <div><strong>Delete product permanently</strong><p>Remove this product and its shop inventory records. This cannot be undone; your Leaf Ledger species stays intact.</p></div>
        {!confirmDeleteOpen ? <button type="button" className={styles.deleteTrigger} onClick={() => setConfirmDeleteOpen(true)}>Delete product</button> : null}
        {confirmDeleteOpen ? <form onSubmit={handleDelete} className={styles.deleteConfirm}>
          <input type="hidden" name="id" value={product.id} />
          <p>To permanently delete <strong>{product.title}</strong>, type <strong>DELETE</strong> below.</p>
          <label htmlFor="delete-product-confirmation">Confirmation</label>
          <input id="delete-product-confirmation" name="confirmation" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} autoComplete="off" spellCheck={false} placeholder="DELETE" required />
          {deleteError ? <p className="admin-save-message is-error" role="alert">{deleteError}</p> : null}
          <div className={styles.deleteButtons}>
            <button type="button" className={styles.cancelDelete} onClick={() => { setConfirmDeleteOpen(false); setDeleteText(""); setDeleteError(""); }} disabled={deleting}>Cancel</button>
            <button type="submit" className={styles.deleteTrigger} disabled={deleteText !== "DELETE" || deleting}>{deleting ? "Deleting…" : "Delete permanently"}</button>
          </div>
        </form> : null}
      </div>
    </section>
  </section>;
}
