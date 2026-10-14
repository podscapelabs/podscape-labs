alter table public.keeper_enclosures
 add constraint keeper_enclosures_label_check check (char_length(label) <= 70),
 add constraint keeper_enclosures_type_check check (char_length(enclosure_type) <= 120),
 add constraint keeper_enclosures_notes_check check (char_length(notes) <= 5000);
