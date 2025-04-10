-- Add subject_name column to lectures table
DO $$
BEGIN
    -- Add subject_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lectures' 
        AND column_name = 'subject_name'
    ) THEN
        ALTER TABLE public.lectures 
        ADD COLUMN subject_name TEXT;
        
        -- Update existing records to have subject_name based on subjects table
        UPDATE public.lectures l
        SET subject_name = s.name
        FROM public.subjects s
        WHERE l.subject_id = s.id;
        
        RAISE NOTICE 'Added subject_name column to lectures table and populated existing records';
    ELSE
        RAISE NOTICE 'subject_name column already exists in lectures table';
    END IF;
END
$$; 