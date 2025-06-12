-- Add missing columns to lectures table
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lectures' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.lectures 
        ADD COLUMN status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'needs_revision')) NOT NULL DEFAULT 'not_started';
        
        RAISE NOTICE 'Added status column to lectures table';
    ELSE
        RAISE NOTICE 'status column already exists in lectures table';
    END IF;
    
    -- Add revision_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lectures' 
        AND column_name = 'revision_count'
    ) THEN
        ALTER TABLE public.lectures 
        ADD COLUMN revision_count INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Added revision_count column to lectures table';
    ELSE
        RAISE NOTICE 'revision_count column already exists in lectures table';
    END IF;
    
    -- Add last_revised column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lectures' 
        AND column_name = 'last_revised'
    ) THEN
        ALTER TABLE public.lectures 
        ADD COLUMN last_revised TIMESTAMPTZ;
        
        RAISE NOTICE 'Added last_revised column to lectures table';
    ELSE
        RAISE NOTICE 'last_revised column already exists in lectures table';
    END IF;
    
    -- Add next_revision_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lectures' 
        AND column_name = 'next_revision_date'
    ) THEN
        ALTER TABLE public.lectures 
        ADD COLUMN next_revision_date TIMESTAMPTZ;
        
        RAISE NOTICE 'Added next_revision_date column to lectures table';
    ELSE
        RAISE NOTICE 'next_revision_date column already exists in lectures table';
    END IF;
END
$$; 