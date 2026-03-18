-- Update multi-value related_process fields to use pipe separator
UPDATE decision_tree_questions SET related_process = 'Cutting / Curd Handling | Draining / Whey Separation' WHERE id = 43;
UPDATE decision_tree_questions SET related_process = 'Evaporation / Concentration | Drying (Spray Drying)' WHERE id = 46;
UPDATE decision_tree_questions SET related_process = 'Marination | Curing (Optional)' WHERE id = 53;
UPDATE decision_tree_questions SET related_process = 'Cooking / Heat Treatment | Cooling' WHERE id = 54;
UPDATE decision_tree_questions SET related_process = 'Freezing (IQF / Blast Freezing) | Frozen Storage (Finished Product)' WHERE id = 55;
UPDATE decision_tree_questions SET related_process = 'Washing | Sorting / Grading | Peeling | Cutting | Juice Extraction' WHERE id = 56;
UPDATE decision_tree_questions SET related_process = 'Coagulation | Flocculation' WHERE id = 64;