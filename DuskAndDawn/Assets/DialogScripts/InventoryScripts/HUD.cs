using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class HUD : MonoBehaviour
{
    [SerializeField]
    Metadata _metadata;

    public Inventory Inventory;

    private Canvas canvas;
    private bool show = false;
    private Metadata metadata;

    void Start()
    {
        metadata = GameObject.FindObjectOfType<Metadata>().GetComponent<Metadata>();

        Inventory.ItemAdded += InventoryScript_ItemAdded;
        Inventory.ItemRemoved += InventoryScript_ItemRemoved;
        canvas = gameObject.GetComponent<Canvas>();
        canvas.enabled = show;
    }

    void Update()
    {
        // Don't allow invetory usage in dialog
        if (_metadata.duskInDialog || _metadata.dawnInDialog)
        {
            show = false;
            canvas.enabled = show;
        }

        if (Input.GetKeyDown("b") && !_metadata.duskInDialog && !_metadata.dawnInDialog && gameObject.tag == metadata.curPlayer.name)
        {
            show = !show;
            canvas.enabled = show;
        }
    }

    public void toggleHud(bool showHud)
    {
        show = showHud;
        canvas.enabled = show;
    }

    private void InventoryScript_ItemAdded(object sender, InventoryEventArgs e)
    {
    	Transform inventoryPanel = transform.Find("InventoryPanel");
    	foreach(Transform slot in inventoryPanel)
    	{
            Transform imageTransform = slot.GetChild(0);
    		Image image = imageTransform.GetComponent<Image>();
            ItemDragHandler itemDragHandler = imageTransform.GetComponent<ItemDragHandler>();

    		if (!image.enabled)
    		{
    			image.enabled = true;
    			image.sprite = e.Item.Image;

                itemDragHandler.Item = e.Item;

                // Transform deleteTransform = slot.GetChild(1);
                // Image deleteImage = deleteTransform.GetComponent<Image>();
                // deleteImage.enabled = true;

    			break;
    		}
    	}
    }

    private void InventoryScript_ItemRemoved(object sender, InventoryEventArgs e)
    {
        Transform inventoryPanel = transform.Find("InventoryPanel");
        foreach(Transform slot in inventoryPanel)
        {
            Transform imageTransform = slot.GetChild(0);
            Image image = imageTransform.GetComponent<Image>();
            
            ItemDragHandler itemDragHandler = imageTransform.GetComponent<ItemDragHandler>();
            if (itemDragHandler.Item is null) { continue; }
            if (itemDragHandler.Item.Equals(e.Item))
            {
                image.enabled = false;
                image.sprite = null;
                itemDragHandler.Item = null;

                // Transform deleteTransform = slot.GetChild(1);
                // Image deleteImage = deleteTransform.GetComponent<Image>();
                // deleteImage.enabled = false;

                break;
            }
        }
    }
}
