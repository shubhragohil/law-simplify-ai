import { supabase } from "@/integrations/supabase/client";

export const reprocessStuckDocuments = async () => {
  try {
    // Get all documents stuck in processing
    const { data: stuckDocs, error: fetchError } = await supabase
      .from('documents')
      .select('id, title')
      .eq('processing_status', 'processing');

    if (fetchError) {
      console.error('Error fetching stuck documents:', fetchError);
      return;
    }

    if (!stuckDocs || stuckDocs.length === 0) {
      console.log('No stuck documents found');
      return;
    }

    console.log(`Found ${stuckDocs.length} stuck documents. Reprocessing...`);

    // Process each document
    for (const doc of stuckDocs) {
      try {
        console.log(`Reprocessing document: ${doc.title} (${doc.id})`);
        
        const { data, error } = await supabase.functions.invoke('process-document', {
          body: { documentId: doc.id }
        });

        if (error) {
          console.error(`Error processing document ${doc.id}:`, error);
        } else {
          console.log(`Successfully processed document ${doc.id}:`, data);
        }
      } catch (error) {
        console.error(`Failed to process document ${doc.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in reprocessStuckDocuments:', error);
  }
};