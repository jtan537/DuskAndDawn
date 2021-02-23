using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class HUD : MonoBehaviour
{
    public Inventory Inventory;

    private Canvas canvas;
    private bool show = false;

    void Start()
    {
    	Inventory.ItemAdded += InventoryScript_ItemAdded;
        Inventory.ItemRemoved += InventoryScript_ItemRemoved;
        canvas = gameObject.GetComponent<Canvas>();
        canvas.enabled = show;
    }

    void Update()
    {
        if (Input.GetKeyDown("b"))
        {
            show = !show;
            canvas.enabled = show;
        }
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

                Transform deleteTransform = slot.GetChild(1);
                Image deleteImage = deleteTransform.GetComponent<Image>();
                deleteImage.enabled = true;

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

            if (itemDragHandler.Item.Equals(e.Item))
            {
                image.enabled = false;
                image.sprite = null;
                itemDragHandler.Item = null;

                Transform deleteTransform = slot.GetChild(1);
                Image deleteImage = deleteTransform.GetComponent<Image>();
                deleteImage.enabled = false;

                break;
            }
        }
    }
}
