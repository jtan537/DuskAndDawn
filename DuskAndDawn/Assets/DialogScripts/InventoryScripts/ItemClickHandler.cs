using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class ItemClickHandler : MonoBehaviour
{
    public Inventory inventory;
    public bool active = false;

    public Transform ItemDetails;

    public UseItem useItem;

    public void OnItemClicked()
    {
        ItemDragHandler dragHandler = 
        gameObject.transform.Find("Item").GetComponent<ItemDragHandler>();

        IInventoryItem item = dragHandler.Item;

        Transform imageTransform = gameObject.transform.GetChild(0);
        Image image = imageTransform.GetComponent<Image>();
        if (image.enabled)
        {
            ItemDetails.gameObject.SetActive(!ItemDetails.gameObject.activeSelf);

            Transform imageTrans = ItemDetails.GetChild(0).GetChild(0);
            Image imageDetails = imageTrans.GetComponent<Image>();
            imageDetails.sprite = item.Image;

            Transform descriptionTrans = ItemDetails.GetChild(0).GetChild(1);
            descriptionTrans.GetComponent<TextMeshProUGUI>().SetText(item.Description);

            Transform buttonTrans = ItemDetails.GetChild(0).GetChild(2);
            buttonTrans.GetComponent<Button>().interactable = active;

            useItem.item = item;
        }
    }
}
