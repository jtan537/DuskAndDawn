using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class AwakeImage : MonoBehaviour
{
    void Start()
    {
        gameObject.GetComponent<Image>().enabled = true;
    }
}
